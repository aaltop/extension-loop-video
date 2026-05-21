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

    not_docs_link_replace = re.compile(r"\(\./(?P<link>(?!docs)/?.*?)\)")

    docs_link_replace = re.compile(r"\((?P<prefix>\./docs/)(?P<suffix>.*?)\)")

    github_prefix = "https://www.github.com/aaltop/extension-loop-video/blob/main/"
    # replace any non-docs links with a link to the github location
    destination_content = not_docs_link_replace.sub(
        rf"({github_prefix}\g<link>)", origin_content
    )
    # ...and only then replace the docs links
    destination_content = docs_link_replace.sub(r"(\g<suffix>)", destination_content)

    destination.write_text(destination_content)


def main():

    readme_to_index()


if __name__ == "__main__":
    main()
