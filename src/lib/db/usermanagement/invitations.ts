import { getDb } from "../db-connection";
import { eq, and } from "drizzle-orm";
import {
  organisationInvitations,
  OrganisationInvitationsInsert,
  organisationMembers,
  users,
} from "../schema/users";

// Funktion, um alle Einladungen zu Organisationen abzurufen
export const getAllOrganisationInvitations = async () => {
  return await getDb().select().from(organisationInvitations);
};

// Funktion, um eine "pending" Einladung zu akzeptieren
export const acceptOrganisationInvitation = async (
  invitationId: string,
  userId: string
) => {
  const invitations = await getDb()
    .select()
    .from(organisationInvitations)
    .where(eq(organisationInvitations.id, invitationId));
  const invitation = invitations[0] || undefined;

  if (!invitation || invitation.status !== "pending") {
    throw new Error("Invitation not found or not pending");
  }

  const userRes = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, userId));
  const user = userRes[0] || undefined;

  if (!user || user.email !== invitation.email) {
    throw new Error("User email does not match invitation email");
  }

  await getDb().transaction(async (trx) => {
    await trx
      .update(organisationInvitations)
      .set({ status: "accepted" })
      .where(eq(organisationInvitations.id, invitationId));

    await trx.insert(organisationMembers).values({
      userId,
      organisationId: invitation.organisationId,
      role: "member",
    });
  });
};

// Funktion, um alle "pending" Einladungen einer UserId zu akzeptieren
export const acceptAllPendingInvitationsForUser = async (userId: string) => {
  const userRes = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, userId));
  const user = userRes[0] || undefined;

  if (!user) {
    throw new Error("User not found");
  }

  const pendingInvitations = await getDb()
    .select()
    .from(organisationInvitations)
    .where(
      and(
        eq(organisationInvitations.email, user.email),
        eq(organisationInvitations.status, "pending")
      )
    );

  await getDb().transaction(async (trx) => {
    for (const invitation of pendingInvitations) {
      await trx
        .update(organisationInvitations)
        .set({ status: "accepted" })
        .where(eq(organisationInvitations.id, invitation.id));

      await trx.insert(organisationMembers).values({
        userId,
        organisationId: invitation.organisationId,
        role: "member",
      });
    }
  });
};

// Funktion, um eine Einladung abzulehnen
export const declineOrganisationInvitation = async (invitationId: string) => {
  await getDb()
    .update(organisationInvitations)
    .set({ status: "declined" })
    .where(eq(organisationInvitations.id, invitationId));
};

// Funktion, um eine Einladung zu erstellen
export const createOrganisationInvitation = async (
  data: OrganisationInvitationsInsert
) => {
  const result = await getDb()
    .insert(organisationInvitations)
    .values(data)
    .returning();
  return result[0];
};
