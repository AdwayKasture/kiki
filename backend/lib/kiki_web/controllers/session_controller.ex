defmodule KikiWeb.SessionController do
  use KikiWeb, :controller

  alias Kiki.Sessions
  alias Kiki.Session

  def index(conn, _params) do
    sessions = Sessions.list_sessions()
    render(conn, :index, sessions: sessions)
  end

  def show(conn, %{"id" => id}) do
    session = Sessions.get_session!(id)
    render(conn, :show, session: session)
  end

  def create(conn, %{"source" => source}) do
    case Sessions.create_session_from_markdown(source) do
      {:ok, %Session{} = session} ->
        conn
        |> put_status(:created)
        |> render(:show, session: session)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    session = Sessions.get_session!(id)

    with {:ok, %Session{}} <- Sessions.delete_session(session) do
      send_resp(conn, :no_content, "")
    end
  end
end
