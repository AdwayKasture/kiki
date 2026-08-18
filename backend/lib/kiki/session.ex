defmodule Kiki.Session do
  use Ecto.Schema
  import Ecto.Changeset

  schema "sessions" do
    field :title, :string
    field :session_id, :string
    field :created_at, :string
    field :source_updated_at, :string
    field :source, :string
    field :entries, {:array, :map}, default: []

    timestamps(type: :utc_datetime_usec)
  end

  def changeset(session, attrs) do
    session
    |> cast(attrs, [:title, :session_id, :created_at, :source_updated_at, :source, :entries])
    |> validate_required([:title, :source, :entries])
  end
end
