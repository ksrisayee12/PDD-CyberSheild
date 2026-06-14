"""
Instagram Collector Service
Uses Playwright to scrape comments and DMs.
Session expires after 15 minutes.
"""
import asyncio
import logging
import threading
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import decrypt
from app.database.base import SessionLocal
from app.models.instagram import InstagramAccount, Post
from app.models.content import Comment, Message, Conversation
from app.models.user import User
from app.services.analysis_pipeline import analyze_content

logger = logging.getLogger(__name__)

_active_monitors: dict[int, threading.Event] = {}


def is_session_expired(account: InstagramAccount) -> bool:
    if not account.session_started_at:
        return True
    expiry = account.session_started_at + timedelta(minutes=settings.INSTAGRAM_SESSION_EXPIRE_MINUTES)
    return datetime.utcnow() > expiry


async def _scrape_comments(page, post_url: str) -> list[dict]:
    comments = []
    try:
        await page.goto(post_url, timeout=30000)
        await page.wait_for_timeout(3000)
        # Load more comments
        for _ in range(3):
            try:
                load_more = page.locator("text=Load more comments").first
                if await load_more.is_visible(timeout=2000):
                    await load_more.click()
                    await page.wait_for_timeout(1500)
            except Exception:
                break

        comment_els = await page.locator("ul ul > li").all()
        for el in comment_els[:50]:
            try:
                author_el = el.locator("a").first
                text_el = el.locator("span").first
                author = await author_el.inner_text(timeout=2000)
                text = await text_el.inner_text(timeout=2000)
                if author and text:
                    comments.append({"author": author.strip(), "content": text.strip()})
            except Exception:
                continue
    except Exception as e:
        logger.error(f"Comment scrape error: {e}")
    return comments


async def _scrape_dms(page) -> list[dict]:
    """
    Scrape DM threads. Returns list of {sender, content} dicts.
    Participant name is extracted from the thread element's aria-label or
    visible text before clicking, so we never fall back to 'unknown'.
    """
    messages = []
    try:
        await page.goto("https://www.instagram.com/direct/inbox/", timeout=30000)
        await page.wait_for_timeout(3000)
        threads = await page.locator("div[role='listbox'] > div").all()
        for idx, thread in enumerate(threads[:5]):
            # --- Extract participant name BEFORE clicking ---
            participant = None
            try:
                # aria-label often contains the username, e.g. "Chat with johndoe"
                aria = await thread.get_attribute("aria-label")
                if aria:
                    # Strip common prefixes like "Chat with "
                    for prefix in ("Chat with ", "Conversation with ", "Thread with "):
                        if aria.lower().startswith(prefix.lower()):
                            participant = aria[len(prefix):].strip()
                            break
                    if not participant:
                        participant = aria.strip()
            except Exception:
                pass

            if not participant:
                try:
                    # Fall back to the visible username span inside the thread element
                    span = thread.locator("span").first
                    text = await span.inner_text(timeout=1500)
                    if text and text.strip():
                        participant = text.strip().split("\n")[0]  # first line only
                except Exception:
                    pass

            if not participant:
                participant = f"dm_user_{idx}"

            try:
                await thread.click()
                await page.wait_for_timeout(2000)
                msgs = await page.locator("div[role='row']").all()
                for msg in msgs[-20:]:
                    try:
                        text = await msg.inner_text(timeout=1500)
                        if text.strip():
                            messages.append({"sender": participant, "content": text.strip()})
                    except Exception:
                        continue
            except Exception:
                continue
    except Exception as e:
        logger.error(f"DM scrape error: {e}")
    return messages


async def _run_monitor(account_id: int, stop_event: threading.Event):
    from playwright.async_api import async_playwright

    db: Session = SessionLocal()
    try:
        account = db.query(InstagramAccount).filter(InstagramAccount.id == account_id).first()
        if not account:
            return

        username = account.account_username
        try:
            password = decrypt(account.password_encrypted) if account.password_encrypted else ""
        except Exception:
            logger.error("Could not decrypt Instagram password")
            return

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            import os
            state_dir = "sessions"
            os.makedirs(state_dir, exist_ok=True)
            state_path = os.path.join(state_dir, f"account_{account_id}.json")
            
            if os.path.exists(state_path):
                context = await browser.new_context(storage_state=state_path)
                logger.info(f"Loaded existing session state for {username}")
            else:
                context = await browser.new_context()

            page = await context.new_page()

            # Check if already logged in by going to homepage
            try:
                await page.goto("https://www.instagram.com/", timeout=30000)
                await page.wait_for_timeout(2000)
                
                # If redirected to login page or we see login inputs, we need to login
                login_inputs = await page.locator("input[name='username']").count()
                if login_inputs > 0 or "login" in page.url:
                    # Login — Instagram's login button is type="button", NOT type="submit"
                    await page.goto("https://www.instagram.com/accounts/login/", timeout=30000)
                    await page.wait_for_timeout(2000)
                    await page.fill("input[name='username']", username)
                    await page.fill("input[name='password']", password)
                    await page.click("button[type='button']")
                    # Wait for the URL to leave the login page (up to 15s)
                    try:
                        await page.wait_for_url("**/", timeout=15000)
                        logger.info(f"Instagram login succeeded for {username}")
                        await context.storage_state(path=state_path)
                    except Exception:
                        # Some flows redirect to a different URL (e.g. /challenge/)
                        if "login" in page.url:
                            logger.error(f"Instagram login failed for {username} — still on login page")
                            await browser.close()
                            return
                        logger.warning(f"Instagram login: unusual redirect to {page.url}, continuing")
                        await context.storage_state(path=state_path)
                else:
                    logger.info(f"Resumed active session for {username}")
            except Exception as e:
                logger.error(f"Instagram session check/login error: {e}")
                await browser.close()
                return

            # Monitoring loop
            while not stop_event.is_set():
                db.refresh(account)
                if is_session_expired(account):
                    logger.info(f"Session expired for account {account_id}")
                    break

                user = db.query(User).filter(User.id == account.user_id).first()
                if not user:
                    break

                # Scrape profile posts
                try:
                    await page.goto(f"https://www.instagram.com/{username}/", timeout=30000)
                    await page.wait_for_timeout(3000)
                    post_links = await page.locator("a[href*='/p/']").all()
                    post_urls = []
                    for link in post_links[:5]:
                        href = await link.get_attribute("href")
                        if href and "/p/" in href:
                            full_url = f"https://www.instagram.com{href}"
                            if full_url not in post_urls:
                                post_urls.append(full_url)

                    for post_url in post_urls[:3]:
                        # Check if post already exists
                        post_id_str = post_url.split("/p/")[1].rstrip("/")
                        existing_post = db.query(Post).filter(Post.instagram_post_id == post_id_str).first()
                        if not existing_post:
                            post = Post(
                                instagram_post_id=post_id_str,
                                account_id=account.id,
                                post_url=post_url,
                            )
                            db.add(post)
                            db.commit()
                            db.refresh(post)
                        else:
                            post = existing_post

                        # Scrape comments
                        raw_comments = await _scrape_comments(page, post_url)
                        for c in raw_comments:
                            exists = db.query(Comment).filter(
                                Comment.post_id == post.id,
                                Comment.author == c["author"],
                                Comment.content == c["content"]
                            ).first()
                            if not exists:
                                comment = Comment(post_id=post.id, author=c["author"], content=c["content"])
                                db.add(comment)
                                db.commit()
                                db.refresh(comment)
                                # Run CPU-bound analysis in a thread pool so we don't
                                # block the asyncio event loop while the ML model runs.
                                loop = asyncio.get_event_loop()
                                await loop.run_in_executor(
                                    None, analyze_content,
                                    db, user, "comment", comment.id, c["content"], c["author"]
                                )

                except Exception as e:
                    logger.error(f"Post scrape error: {e}")

                # Scrape DMs
                try:
                    raw_dms = await _scrape_dms(page)
                    for dm in raw_dms:
                        conv = db.query(Conversation).filter(
                            Conversation.participant == dm["sender"]
                        ).first()
                        if not conv:
                            conv = Conversation(participant=dm["sender"])
                            db.add(conv)
                            db.commit()
                            db.refresh(conv)

                        exists = db.query(Message).filter(
                            Message.conversation_id == conv.id,
                            Message.content == dm["content"]
                        ).first()
                        if not exists:
                            msg = Message(
                                conversation_id=conv.id,
                                sender=dm["sender"],
                                receiver=username,
                                content=dm["content"],
                            )
                            db.add(msg)
                            db.commit()
                            db.refresh(msg)
                            # Run ML analysis without blocking the event loop
                            loop = asyncio.get_event_loop()
                            result = await loop.run_in_executor(
                                None, analyze_content,
                                db, user, "message", msg.id, dm["content"], dm["sender"]
                            )
                            # Update conversation risk
                            conv.message_count = (conv.message_count or 0) + 1
                            if result and result.get("toxicity_score", 0) > 0.3:
                                conv.flagged_count = (conv.flagged_count or 0) + 1
                            conv.risk_score = (conv.flagged_count / max(conv.message_count, 1)) * 100
                            db.commit()
                except Exception as e:
                    logger.error(f"DM scrape error: {e}")

                # Wait ~60s before next scan with some jitter to avoid patterns
                import random
                wait_time = 60 + random.randint(-10, 20)
                for _ in range(wait_time):
                    if stop_event.is_set():
                        break
                    await asyncio.sleep(1)

            await browser.close()

    except Exception as e:
        logger.error(f"Monitor error: {e}")
    finally:
        # Mark stopped
        account = db.query(InstagramAccount).filter(InstagramAccount.id == account_id).first()
        if account:
            account.monitoring_status = "stopped"
            db.commit()
        db.close()


def start_monitoring(account: InstagramAccount):
    if account.id in _active_monitors:
        return
    stop_event = threading.Event()
    _active_monitors[account.id] = stop_event

    def run():
        import sys
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_run_monitor(account.id, stop_event))
        loop.close()
        _active_monitors.pop(account.id, None)

    t = threading.Thread(target=run, daemon=True)
    t.start()


def stop_monitoring(account_id: int):
    ev = _active_monitors.get(account_id)
    if ev:
        ev.set()
        _active_monitors.pop(account_id, None)
