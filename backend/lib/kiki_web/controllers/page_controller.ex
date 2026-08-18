defmodule KikiWeb.PageController do
  use KikiWeb, :controller

  def index(conn, _params) do
    index_path = Application.app_dir(:kiki, "priv/static/index.html")

    case File.read(index_path) do
      {:ok, content} ->
        conn
        |> put_resp_content_type("text/html")
        |> send_resp(200, content)

      {:error, _reason} ->
        send_resp(conn, 404, "index.html not found. Did you run the frontend build?")
    end
  end
end
