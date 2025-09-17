export function formatDate(dateStr) {
  if (!dateStr) return null;
  const datePart = dateStr.split(" ")[0];
  const [month, day, year] = datePart.split("/");
  if (!year || !month || !day) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

export function generateRandomString(length = 22) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}
