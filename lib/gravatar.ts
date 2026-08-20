import md5 from "md5";

/**
 * Constrói o URL do avatar Gravatar associado a um email. Se o utilizador
 * não tiver Gravatar configurado, mostra um avatar gerado automaticamente
 * (identicon), para nunca ficar em branco.
 */
export function getGravatarUrl(email: string, size = 80): string {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}
