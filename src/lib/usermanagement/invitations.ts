/**
 * This file contains the functions for managing organisation invitations
 * Invitations are used to invite users to an organisation
 */

import { eq, and } from "drizzle-orm";
import {
  organisationInvitations,
  type OrganisationInvitationsInsert,
  organisationMembers,
  organisations,
  users,
} from "../db/schema/users";
import { getDb } from "../db/db-connection";
import { getUserByEmail, getUserById, setUsersLastOrganisation } from "./user";
import { _GLOBAL_SERVER_CONFIG } from "../../store";
import { smtpService } from "../email";

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
 * Get all organisation invitations
 */
export const getUsersOrganisationInvitations = async (userId: string) => {
  const user = await getUserById(userId);
  return await getDb()
    .select({
      id: organisationInvitations.id,
      organisationId: organisationInvitations.organisationId,
      organisationName: organisations.name,
      email: organisationInvitations.email,
      status: organisationInvitations.status,
      role: organisationInvitations.role,
    })
    .from(organisationInvitations)
    .leftJoin(
      organisations,
      eq(organisationInvitations.organisationId, organisations.id)
    )
    .where(
      and(
        eq(organisationInvitations.email, user.email),
        eq(organisationInvitations.status, "pending")
      )
    );
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

  await setUsersLastOrganisation(userId, invitation.organisationId);
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

  await setUsersLastOrganisation(userId);
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
  data: OrganisationInvitationsInsert,
  sendMail = false
) => {
  console.log(data);
  // Ensure data has a status field, defaulting to "pending" if not provided
  const dataWithStatus = {
    ...data,
    status: data.status || "pending",
  };

  const [result] = await getDb()
    .insert(organisationInvitations)
    .values(dataWithStatus)
    .onConflictDoUpdate({
      target: [
        organisationInvitations.organisationId,
        organisationInvitations.email,
      ],
      set: {
        status: dataWithStatus.status,
        // Also update role if it's provided
        ...(dataWithStatus.role ? { role: dataWithStatus.role } : {}),
      },
    })
    .returning();

  // send mail
  if (sendMail) {
    // check if user exists
    const user = await getUserByEmail(dataWithStatus.email);

    // when the user is existing send only invite to organisation
    if (user) {
      const { html, subject } =
        await _GLOBAL_SERVER_CONFIG.emailTemplates.inviteToOrganizationWhenUserExists(
          {
            appName: _GLOBAL_SERVER_CONFIG.appName,
            baseUrl: _GLOBAL_SERVER_CONFIG.baseUrl,
            link: `${_GLOBAL_SERVER_CONFIG.baseUrl || "http://localhost:3000"}/static/app/#/shared/organisations`,
          }
        );
      await smtpService.sendMail({
        sender: process.env.SMTP_FROM,
        recipients: [dataWithStatus.email],
        subject,
        html,
      });
    }
    // when user is not existing send mail to invite user to register
    else {
      const { html, subject } =
        await _GLOBAL_SERVER_CONFIG.emailTemplates.inviteToOrganization({
          appName: _GLOBAL_SERVER_CONFIG.appName,
          baseUrl: _GLOBAL_SERVER_CONFIG.baseUrl,
          link: `${_GLOBAL_SERVER_CONFIG.baseUrl || "http://localhost:3000"}/manage/#/login?register=true`,
        });
      await smtpService.sendMail({
        sender: process.env.SMTP_FROM,
        recipients: [dataWithStatus.email],
        subject,
        html,
      });
    }
  }

  return result;
};
