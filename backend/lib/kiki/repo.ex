defmodule Kiki.Repo do
  use Ecto.Repo,
    otp_app: :kiki,
    adapter: Ecto.Adapters.Postgres
end
