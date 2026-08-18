defmodule KikiWeb.SessionControllerTest do
  use KikiWeb.ConnCase

  alias Kiki.Repo
  alias Kiki.Session

  @create_attrs %{
    "source" => """
    # Test Session

    **Session ID:** session-123

    ---

    ## User

    Hello

    ---

    ## Assistant (model-a)

    Hi there
    """
  }

  describe "index" do
    test "lists all sessions", %{conn: conn} do
      conn = get(conn, ~p"/api/sessions")
      assert json_response(conn, 200) == %{"data" => []}
    end
  end

  describe "create session" do
    test "renders session when data is valid", %{conn: conn} do
      conn = post(conn, ~p"/api/sessions", @create_attrs)
      assert %{"data" => %{"id" => id}} = json_response(conn, 201)

      session = Repo.get!(Session, id)
      assert session.title == "Test Session"
      assert session.session_id == "session-123"
      assert [%{"type" => "user"}, %{"type" => "text"}] = session.entries
    end

    test "renders errors when source is missing", %{conn: conn} do
      conn = post(conn, ~p"/api/sessions", %{"source" => ""})
      assert json_response(conn, 422)["errors"] != %{}
    end
  end

  describe "delete session" do
    test "deletes chosen session", %{conn: conn} do
      {:ok, session} = Kiki.Sessions.create_session_from_markdown(@create_attrs["source"])
      conn = delete(conn, ~p"/api/sessions/#{session.id}")
      assert response(conn, 204)

      assert Repo.get(Session, session.id) == nil
    end
  end
end
