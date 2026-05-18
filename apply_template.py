"""
For applying templates across the codespace.
"""

from pathlib import Path
import re


def readme_to_index():
    """
    Write README.md to docs/index.md, replacing links appropriately.
    """

    origin = Path() / "README.md"
    destination = Path() / "docs" / "index.md"

    origin_content = origin.read_text()

    docs_link_replace = re.compile(r"\((?P<prefix>\./docs/)(?P<suffix>.*?)\)")
    destination_content = docs_link_replace.sub(r"(\g<suffix>)", origin_content)

    destination.write_text(destination_content)


def main():

    readme_to_index()


if __name__ == "__main__":
    main()
