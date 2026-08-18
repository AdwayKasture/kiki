defmodule KikiWeb.Router do
  use KikiWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", KikiWeb do
    pipe_through :api

    resources "/sessions", SessionController, only: [:index, :show, :create, :delete]
  end

  scope "/", KikiWeb do
    get "/*path", PageController, :index
  end
end
