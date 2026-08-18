defmodule Kiki.SessionParser do
  @moduledoc """
  Parses agent session markdown into structured data.
  """

  defstruct [:id, :title, :session_id, :created, :updated, :source, :entries]

  def parse(source, id \\ nil) do
    id = id || generate_id()
    lines = String.split(source, "\n")
    sections = split_by_sections(lines)

    header = List.first(sections, [])

    %{title: title, session_id: session_id, created: created, updated: updated} =
      parse_header(header)

    entries =
      sections
      |> Enum.drop(1)
      |> Enum.with_index()
      |> Enum.flat_map(fn {section_lines, turn_index} ->
        section_lines
        |> parse_section()
        |> Enum.with_index()
        |> Enum.map(fn {entry, entry_index} ->
          entry
          |> Map.put(:id, "#{id}-t#{turn_index}-e#{entry_index}")
          |> Map.put(:turn_index, turn_index)
          |> Map.put(:entry_index, entry_index)
        end)
      end)

    %__MODULE__{
      id: id,
      title: title,
      session_id: session_id,
      created: created,
      updated: updated,
      source: source,
      entries: entries
    }
  end

  defp generate_id do
    :crypto.strong_rand_bytes(8) |> Base.url_encode64(padding: false)
  end

  defp split_by_sections(lines) do
    {sections, current, _in_fence} =
      Enum.reduce(lines, {[], [], false}, fn line, {sections, current, in_fence} ->
        trimmed = String.trim(line)
        in_fence = if String.starts_with?(trimmed, "```"), do: not in_fence, else: in_fence

        if not in_fence and trimmed == "---" do
          if current != [] do
            {[Enum.reverse(current) | sections], [], in_fence}
          else
            {sections, current, in_fence}
          end
        else
          {sections, [line | current], in_fence}
        end
      end)

    sections =
      if current != [] do
        [Enum.reverse(current) | sections]
      else
        sections
      end

    Enum.reverse(sections)
  end

  defp parse_header(lines) do
    Enum.reduce(
      lines,
      %{title: "Untitled session", session_id: nil, created: nil, updated: nil},
      fn line, acc ->
        trimmed = String.trim(line)

        acc =
          if String.starts_with?(trimmed, "# ") do
            %{acc | title: String.trim(String.replace_prefix(trimmed, "# ", ""))}
          else
            acc
          end

        acc =
          case Regex.run(~r/^\*\*Session ID:\*\*\s*(.+)$/, trimmed) do
            [_, value] -> %{acc | session_id: String.trim(value)}
            _ -> acc
          end

        acc =
          case Regex.run(~r/^\*\*Created:\*\*\s*(.+)$/, trimmed) do
            [_, value] -> %{acc | created: String.trim(value)}
            _ -> acc
          end

        acc =
          case Regex.run(~r/^\*\*Updated:\*\*\s*(.+)$/, trimmed) do
            [_, value] -> %{acc | updated: String.trim(value)}
            _ -> acc
          end

        acc
      end
    )
  end

  defp assistant_marker?(line) do
    trimmed = String.trim(line)

    trimmed == "_Thinking:_" or
      Regex.match?(~r/^\*\*Tool:\s*(.+?)\*\*$/, trimmed) or
      Regex.match?(~r/^##\s+/, trimmed)
  end

  defp read_code_block(lines) do
    lines = Enum.drop_while(lines, fn line -> String.trim(line) == "" end)

    case lines do
      [line | rest] ->
        trimmed = String.trim(line)

        if String.starts_with?(trimmed, "```") do
          do_read_code_block(rest, [])
        else
          {[], lines}
        end

      [] ->
        {[], []}
    end
  end

  defp do_read_code_block([line | rest], acc) do
    if String.trim(line) == "```" do
      {Enum.reverse(acc), rest}
    else
      do_read_code_block(rest, [line | acc])
    end
  end

  defp do_read_code_block([], acc) do
    {Enum.reverse(acc), []}
  end

  defp parse_assistant_body(body_lines) do
    body_lines
    |> do_parse_assistant_body([], [])
    |> Enum.reverse()
  end

  defp do_parse_assistant_body([], entries, text_buffer) do
    flush_text(entries, text_buffer)
  end

  defp do_parse_assistant_body([line | rest], entries, text_buffer) do
    trimmed = String.trim(line)

    cond do
      trimmed == "_Thinking:_" ->
        entries = flush_text(entries, text_buffer)
        {thinking_lines, remaining} = collect_until(rest, &assistant_marker?/1, [])

        entries =
          case thinking_lines |> Enum.join("\n") |> String.trim() do
            "" -> entries
            text -> [%{type: "thinking", text: text} | entries]
          end

        do_parse_assistant_body(remaining, entries, [])

      Regex.match?(~r/^\*\*Tool:\s*(.+?)\*\*$/, trimmed) ->
        entries = flush_text(entries, text_buffer)
        tool_name = Regex.run(~r/^\*\*Tool:\s*(.+?)\*\*$/, trimmed) |> Enum.at(1) |> String.trim()

        # Skip to **Input:**
        rest_after_input_header = skip_until(rest, "**Input:**")
        {input_block, rest_after_input} = read_code_block(rest_after_input_header)
        input = Enum.join(input_block, "\n") |> String.trim()

        # Skip to **Output:**
        rest_after_output_header = skip_until(rest_after_input, "**Output:**")
        {output_block, rest_after_output} = read_code_block(rest_after_output_header)
        output = Enum.join(output_block, "\n") |> String.trim()

        entry = %{type: "tool", tool: tool_name, input: input, output: output}
        do_parse_assistant_body(rest_after_output, [entry | entries], [])

      true ->
        do_parse_assistant_body(rest, entries, [line | text_buffer])
    end
  end

  defp collect_until(lines, predicate, acc) do
    case lines do
      [] ->
        {Enum.reverse(acc), []}

      [line | rest] ->
        if predicate.(line) do
          {Enum.reverse(acc), [line | rest]}
        else
          collect_until(rest, predicate, [line | acc])
        end
    end
  end

  defp skip_until(lines, marker) do
    case Enum.find_index(lines, fn line -> String.trim(line) == marker end) do
      nil -> lines
      index -> Enum.drop(lines, index + 1)
    end
  end

  defp flush_text(entries, text_buffer) do
    case Enum.reverse(text_buffer) |> Enum.join("\n") |> String.trim() do
      "" -> entries
      text -> [%{type: "text", text: text} | entries]
    end
  end

  defp parse_section(section_lines) do
    section_lines = Enum.drop_while(section_lines,fn line -> String.trim(line) == "" end)
    case section_lines do
      [] -> []
      [first_line | body_lines] ->
        trimmed = String.trim(first_line)

        cond do
          String.starts_with?(trimmed, "## User") ->
            case Enum.join(body_lines, "\n") |> String.trim() do
              "" -> []
              body -> [%{type: "user", text: body}]
            end

          Regex.match?(~r/^## Assistant \((.+?)\)\s*$/, trimmed) ->
            body_lines = Enum.drop_while(body_lines, fn line -> String.trim(line) == "" end)
            parse_assistant_body(body_lines)

          true ->
            []
        end
    end
  end
end
