defmodule KikiWeb.SessionJSON do
  def index(%{sessions: sessions}) do
    %{data: for(session <- sessions, do: data(session))}
  end

  def show(%{session: session}) do
    %{data: data(session)}
  end

  def error(%{changeset: changeset}) do
    %{errors: Ecto.Changeset.traverse_errors(changeset, &translate_error/1)}
  end

  defp data(%Kiki.Session{} = session) do
    %{
      id: session.id,
      title: session.title,
      sessionId: session.session_id,
      created: session.created_at,
      updated: session.source_updated_at,
      source: session.source,
      entries: session.entries
    }
  end

  defp translate_error({msg, opts}) do
    Regex.replace(~r/%{(\w+)}/, msg, fn _match, key ->
      opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
    end)
  end
end
