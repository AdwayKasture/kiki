defmodule Kiki.Sessions do
  @moduledoc """
  The Sessions context.
  """

  import Ecto.Query, warn: false
  alias Kiki.Repo
  alias Kiki.Session
  alias Kiki.SessionParser

  def list_sessions do
    Repo.all(from s in Session, order_by: [desc: s.inserted_at])
  end

  def get_session!(id), do: Repo.get!(Session, id)

  def create_session_from_markdown(source) do
    parsed = SessionParser.parse(source)

    attrs = %{
      title: parsed.title,
      session_id: parsed.session_id,
      created_at: parsed.created,
      source_updated_at: parsed.updated,
      source: parsed.source,
      entries: parsed.entries
    }

    %Session{}
    |> Session.changeset(attrs)
    |> Repo.insert()
  end

  def delete_session(%Session{} = session) do
    Repo.delete(session)
  end
end
