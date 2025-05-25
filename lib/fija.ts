export async function getLetras() {
  const response = await fetch("https://data912.com/live/arg_notes", {
    next: { revalidate: 1200 },
  });
  const data = await response.json();
  return data;
}

export async function getBonos() {
  const response = await fetch("https://data912.com/live/arg_bonds", {
    next: { revalidate: 1200 },
  });
  const data = await response.json();
  return data;
}
