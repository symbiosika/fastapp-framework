/* export const authAndSetUsersInfo = async (c: Context, next: Function) => {
  try {
    const decodedAndVerifiedToken = checkToken(c);

    if (typeof decodedAndVerifiedToken === "object") {
      c.set("usersEmail", decodedAndVerifiedToken.email ?? "");
      c.set("usersId", decodedAndVerifiedToken.sub ?? "");
      c.set("usersRoles", decodedAndVerifiedToken["symbiosika/roles"] ?? []);
    } else {
      return c.text("Invalid token", 401);
    }
  } catch (err) {
    return c.text("Unauthorized", 401);
  }
  await next();
};
 */