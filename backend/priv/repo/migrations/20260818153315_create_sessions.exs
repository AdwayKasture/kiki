defmodule Kiki.Repo.Migrations.CreateSessions do
  use Ecto.Migration

  def change do
    create table(:sessions) do
      add :title, :string, null: false
      add :session_id, :string
      add :created_at, :string
      add :source_updated_at, :string
      add :source, :text, null: false
      add :entries, :jsonb, null: false, default: "[]"

      timestamps(type: :utc_datetime_usec)
    end

    create index(:sessions, [:session_id])
  end
end
