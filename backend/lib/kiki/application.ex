defmodule Kiki.Application do
  # See https://elixir.hexdocs.pm/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      KikiWeb.Telemetry,
      Kiki.Repo,
      {DNSCluster, query: Application.get_env(:kiki, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Kiki.PubSub},
      # Start a worker by calling: Kiki.Worker.start_link(arg)
      # {Kiki.Worker, arg},
      # Start to serve requests, typically the last entry
      KikiWeb.Endpoint
    ]

    # See https://elixir.hexdocs.pm/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Kiki.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    KikiWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
