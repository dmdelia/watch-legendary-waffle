from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

# Tests need not install yt-dlp because no network-based sync takes place here.
sys.modules.setdefault("yt_dlp", types.SimpleNamespace(YoutubeDL=object))
script = Path(__file__).resolve().parents[1] / "scripts" / "sync_youtube.py"
spec = importlib.util.spec_from_file_location("astrea_watch_sync", script)
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)

TEST_ID = "BbBbBbBbBbB"


class FakeHeaders:
    def get_content_type(self):
        return "image/jpeg"


class FakeHTTP:
    headers = FakeHeaders()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self, _):
        return b"\xff\xd8\xff" + b"x" * 2500


class ThumbnailTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.before = sync.THUMBNAILS
        self.addCleanup(setattr, sync, "THUMBNAILS", self.before)
        sync.THUMBNAILS = Path(self.tmp.name) / "thumbs"

    def test_thumbnail_is_saved_same_origin(self):
        with patch.object(sync, "urlopen", return_value=FakeHTTP()) as requested:
            result = sync.cache_thumbnail(TEST_ID)
            self.assertEqual(result, "/assets/thumbnails/" + TEST_ID + ".jpg")
            self.assertEqual(requested.call_count, 1)
        path = sync.THUMBNAILS / (TEST_ID + ".jpg")
        self.assertTrue(path.exists())
        with patch.object(sync, "urlopen", side_effect=AssertionError("Should use local cache")):
            self.assertEqual(sync.cache_thumbnail(TEST_ID), result)

    def test_no_traversal_or_untrusted_ids(self):
        with patch.object(sync, "urlopen", side_effect=AssertionError("Never fetch invalid ID")):
            self.assertIsNone(sync.cache_thumbnail("../../etc/passwd"))
            self.assertIsNone(sync.cache_thumbnail("aaaaaaaaaa"))

    def test_prune_removes_only_expired_video_images(self):
        sync.THUMBNAILS.mkdir(parents=True)
        good = sync.THUMBNAILS / (TEST_ID + ".jpg")
        old = sync.THUMBNAILS / ("aAaAaAaAaAa.jpg")
        unknown = sync.THUMBNAILS / "other.jpg"
        for path in (good, old, unknown):
            path.write_bytes(b"test")
        sync.clean_old_thumbnails({TEST_ID})
        self.assertTrue(good.exists())
        self.assertFalse(old.exists())
        self.assertTrue(unknown.exists())


if __name__ == "__main__":
    unittest.main()
