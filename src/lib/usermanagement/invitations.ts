/**
 * This file contains the functions for managing organisation invitations
 * Invitations are used to invite users to an organisation
 */

import { eq, and } from "drizzle-orm";
import {
  organisationInvitations,
  type OrganisationInvitationsInsert,
  organisationMembers,
  users,
} from "../db/schema/users";
import { getDb } from "../db/db-connection";

/**
 * Get all organisation invitations
 */
export const getAllOrganisationInvitations = async (organisationId: string) => {
  return await getDb()
    .select()
    .from(organisationInvitations)
    .where(eq(organisationInvitations.organisationId, organisationId));
};

/**
 * Drop an invitation by its ID
 */
export const dropOrganisationInvitation = async (invitationId: string) => {
  await getDb()
    .delete(organisationInvitations)
    .where(eq(organisationInvitations.id, invitationId));
};

/**
 * Accept an invitation with its ID and for one user
 */
export const acceptOrganisationInvitation = async (
  invitationId: string,
  userId: string,
  organisationId: string
) => {
  const invitations = await getDb()
    .select()
    .from(organisationInvitations)
    .where(
      and(
        eq(organisationInvitations.id, invitationId),
        eq(organisationInvitations.organisationId, organisationId)
      )
    );
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

/**
 * Accept all pending invitations for a user independent of a specific invitation
 */
export const acceptAllPendingInvitationsForUser = async (
  userId: string,
  organisationId: string
) => {
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
        eq(organisationInvitations.status, "pending"),
        eq(organisationInvitations.organisationId, organisationId)
      )
    );

  if (pendingInvitations.length === 0) {
    throw new Error("No pending invitations found");
  }

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

/**
 * Decline an invitation by its ID
 */
export const declineOrganisationInvitation = async (invitationId: string) => {
  await getDb()
    .update(organisationInvitations)
    .set({ status: "declined" })
    .where(eq(organisationInvitations.id, invitationId));
};

/**
 * Decline all pending invitations for a user independent of a specific invitation
 */
export const declineAllPendingInvitationsForUser = async (
  userId: string,
  organisationId: string
) => {
  const userRes = await getDb()
    .select()
    .from(users)
    .where(eq(users.id, userId));
  const user = userRes[0] || undefined;

  if (!user) {
    throw new Error("User not found");
  }

  await getDb()
    .update(organisationInvitations)
    .set({ status: "declined" })
    .where(
      and(
        eq(organisationInvitations.email, user.email),
        eq(organisationInvitations.organisationId, organisationId)
      )
    );
};

/**
 * Create a new invitation in the database
 */
export const createOrganisationInvitation = async (
  data: OrganisationInvitationsInsert
) => {
  const result = await getDb()
    .insert(organisationInvitations)
    .values(data)
    .returning();
  return result[0];
};
