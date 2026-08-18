defmodule Kiki.SessionParserTest do
  use ExUnit.Case, async: true

  alias Kiki.SessionParser

  describe "parse/1" do
    test "parses a simple session with header and user/assistant turns" do
      source = """
      # My Session

      **Session ID:** session-123
      **Created:** 2024-01-01
      **Updated:** 2024-01-02

      ---

      ## User

      Hello, assistant!

      ---

      ## Assistant (model-a)

      Hello, user!

      _Thinking:_

      Let me think about this.

      **Tool: read**

      **Input:**

      ```json
      {"path": "README.md"}
      ```

      **Output:**

      ```
      # Hello
      ```

      Final text.
      """

      parsed = SessionParser.parse(source, "test-id")

      assert parsed.title == "My Session"
      assert parsed.session_id == "session-123"
      assert parsed.created == "2024-01-01"
      assert parsed.updated == "2024-01-02"
      assert parsed.source == source
      assert length(parsed.entries) == 5

      [user, text1, thinking, tool, text2] = parsed.entries

      assert user.type == "user"
      assert user.text == "Hello, assistant!"
      assert user.turn_index == 0
      assert user.entry_index == 0
      assert user.id == "test-id-t0-e0"

      assert text1.type == "text"
      assert text1.text == "Hello, user!"
      assert text1.turn_index == 1

      assert thinking.type == "thinking"
      assert thinking.text == "Let me think about this."

      assert tool.type == "tool"
      assert tool.tool == "read"
      assert tool.input == ~s({"path": "README.md"})
      assert tool.output == "# Hello"

      assert text2.type == "text"
      assert text2.text == "Final text."
    end

    test "defaults title when header has no title line" do
      source = """
      **Session ID:** session-456

      ---

      ## User

      Hi
      """

      parsed = SessionParser.parse(source)
      assert parsed.title == "Untitled session"
      assert parsed.session_id == "session-456"
      assert [entry] = parsed.entries
      assert entry.type == "user"
      assert entry.text == "Hi"
    end

    test "ignores code fences when splitting sections" do
      source = """
      # Code Example

      ---

      ## Assistant (model-a)

      ```
      ---
      ```

      After fence.
      """

      parsed = SessionParser.parse(source)
      assert parsed.title == "Code Example"
      assert [text] = parsed.entries
      assert text.text == "```\n---\n```\n\nAfter fence."
    end
  end
end
