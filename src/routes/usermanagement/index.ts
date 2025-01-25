import type { FastAppHono } from "../../types";
import { HTTPException } from "hono/http-exception";
import type { Context } from "hono";
import { authAndSetUsersInfo } from "../../lib/utils/hono-middlewares";
import {
  createOrganisation,
  getOrganisation,
  updateOrganisation,
  deleteOrganisation,
  getUserOrganisations,
  getLastOrganisation,
  setLastOrganisation,
  getTeamsAndMembersByOrganisation,
} from "../../lib/usermanagement/oganisations";
import {
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
} from "../../lib/usermanagement/teams";
import {
  createPermissionGroup,
  getPermissionGroup,
  updatePermissionGroup,
  deletePermissionGroup,
  getPermissionGroupsByOrganisation,
  createPathPermission,
  getPathPermission,
  updatePathPermission,
  assignPermissionToGroup,
  deletePathPermission,
  removePermissionFromGroup,
} from "../../lib/usermanagement/permissions";
import {
  getAllOrganisationInvitations,
  acceptOrganisationInvitation,
  declineOrganisationInvitation,
  createOrganisationInvitation,
  acceptAllPendingInvitationsForUser,
} from "../../lib/usermanagement/invitations";

const BASE_PATH = "/usermanagement";

export function defineUserManagementRoutes(
  app: FastAppHono,
  API_BASE_PATH: string
) {
  // ---
  // Organisation routes
  // ---

  app.post(
    API_BASE_PATH + BASE_PATH + "/organisations",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const org = await createOrganisation(data);
        return c.json(org);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating organisation: " + err,
        });
      }
    }
  );

  app.get(
    API_BASE_PATH + BASE_PATH + "/organisations/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const org = await getOrganisation(c.req.param("id"));
        if (!org) {
          throw new HTTPException(404, { message: "Organisation not found" });
        }
        return c.json(org);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting organisation: " + err,
        });
      }
    }
  );

  app.put(
    API_BASE_PATH + BASE_PATH + "/organisations/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const org = await updateOrganisation(c.req.param("id"), data);
        return c.json(org);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error updating organisation: " + err,
        });
      }
    }
  );

  app.delete(
    API_BASE_PATH + BASE_PATH + "/organisations/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        await deleteOrganisation(c.req.param("id"));
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error deleting organisation: " + err,
        });
      }
    }
  );

  // ---
  // Team routes
  // ---

  app.post(
    API_BASE_PATH + BASE_PATH + "/teams",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const team = await createTeam(data);
        return c.json(team);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating team: " + err,
        });
      }
    }
  );

  app.get(
    API_BASE_PATH + BASE_PATH + "/organisations/:orgId/teams",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const teams = await getTeamsAndMembersByOrganisation(
          c.req.param("orgId")
        );
        return c.json(teams);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting teams: " + err,
        });
      }
    }
  );

  app.get(
    API_BASE_PATH + BASE_PATH + "/teams/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      const team = await getTeam(c.req.param("id"));
      return c.json(team);
    }
  );

  app.put(
    API_BASE_PATH + BASE_PATH + "/teams/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const team = await updateTeam(c.req.param("id"), data);
        return c.json(team);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error updating team: " + err,
        });
      }
    }
  );

  app.delete(
    API_BASE_PATH + BASE_PATH + "/teams/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      await deleteTeam(c.req.param("id"));
      return c.json({ success: true });
    }
  );

  // ---
  // Team member management
  // ---

  app.post(
    API_BASE_PATH + BASE_PATH + "/teams/:teamId/members",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const { userId, role } = await c.req.json();
        const member = await addTeamMember(c.req.param("teamId"), userId, role);
        return c.json(member);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error adding team member: " + err,
        });
      }
    }
  );

  app.delete(
    API_BASE_PATH + BASE_PATH + "/teams/:teamId/members/:userId",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        await removeTeamMember(c.req.param("teamId"), c.req.param("userId"));
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error removing team member: " + err,
        });
      }
    }
  );

  // ---
  // Invitation routes
  // ---

  app.post(
    API_BASE_PATH + BASE_PATH + "/invitations",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const invitation = await createOrganisationInvitation(data);
        return c.json(invitation);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating invitation: " + err,
        });
      }
    }
  );

  app.get(
    API_BASE_PATH + BASE_PATH + "/invitations",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const invitations = await getAllOrganisationInvitations();
        return c.json(invitations);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting invitations: " + err,
        });
      }
    }
  );

  app.post(
    API_BASE_PATH + BASE_PATH + "/invitations/:id/accept",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const id = c.req.param("id");

        if (id.toLowerCase() === "all") {
          await acceptAllPendingInvitationsForUser(userId);
        } else {
          await acceptOrganisationInvitation(id, userId);
        }
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error accepting invitation: " + err,
        });
      }
    }
  );

  app.post(
    API_BASE_PATH + BASE_PATH + "/invitations/:id/decline",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        await declineOrganisationInvitation(c.req.param("id"));
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error declining invitation: " + err,
        });
      }
    }
  );

  // ---
  // Permission management routes
  // ---

  app.post(
    API_BASE_PATH + BASE_PATH + "/permission-groups",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const group = await createPermissionGroup(data);
        return c.json(group);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating permission group: " + err,
        });
      }
    }
  );

  app.get(
    API_BASE_PATH + BASE_PATH + "/permission-groups/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      const group = await getPermissionGroup(c.req.param("id"));
      return c.json(group);
    }
  );

  app.put(
    API_BASE_PATH + BASE_PATH + "/permission-groups/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const group = await updatePermissionGroup(c.req.param("id"), data);
        return c.json(group);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error updating permission group: " + err,
        });
      }
    }
  );

  app.delete(
    API_BASE_PATH + BASE_PATH + "/permission-groups/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      await deletePermissionGroup(c.req.param("id"));
      return c.json({ success: true });
    }
  );

  app.post(
    API_BASE_PATH + BASE_PATH + "/path-permissions",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const data = await c.req.json();
        const permission = await createPathPermission(data);
        return c.json(permission);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error creating path permission: " + err,
        });
      }
    }
  );

  app.get(
    API_BASE_PATH + BASE_PATH + "/path-permissions/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      const permission = await getPathPermission(c.req.param("id"));
      return c.json(permission);
    }
  );

  app.put(
    API_BASE_PATH + BASE_PATH + "/path-permissions/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      const data = await c.req.json();
      const permission = await updatePathPermission(c.req.param("id"), data);
      return c.json(permission);
    }
  );

  app.delete(
    API_BASE_PATH + BASE_PATH + "/path-permissions/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      await deletePathPermission(c.req.param("id"));
      return c.json({ success: true });
    }
  );

  app.post(
    API_BASE_PATH +
      BASE_PATH +
      "/permission-groups/:groupId/permissions/:permissionId",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const result = await assignPermissionToGroup(
          c.req.param("groupId"),
          c.req.param("permissionId")
        );
        return c.json(result);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error assigning permission to group: " + err,
        });
      }
    }
  );

  app.delete(
    API_BASE_PATH +
      BASE_PATH +
      "/permission-groups/:groupId/permissions/:permissionId",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        await removePermissionFromGroup(
          c.req.param("groupId"),
          c.req.param("permissionId")
        );
        return c.json({ success: true });
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error removing permission from group: " + err,
        });
      }
    }
  );

  app.get(
    API_BASE_PATH + BASE_PATH + "/my-organisations",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const orgs = await getUserOrganisations(userId);
        return c.json(orgs);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting user organisations: " + err,
        });
      }
    }
  );

  app.get(
    API_BASE_PATH + BASE_PATH + "/last-organisation",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const org = await getLastOrganisation(userId);
        return c.json(org);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting last organisation: " + err,
        });
      }
    }
  );

  app.post(
    API_BASE_PATH + BASE_PATH + "/set-last-organisation/:id",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const userId = c.get("usersId");
        const orgId = c.req.param("id");
        const result = await setLastOrganisation(userId, orgId);
        return c.json(result);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error setting last organisation: " + err,
        });
      }
    }
  );

  app.get(
    API_BASE_PATH + BASE_PATH + "/organisations/:orgId/permission-groups",
    authAndSetUsersInfo,
    async (c: Context) => {
      try {
        const groups = await getPermissionGroupsByOrganisation(
          c.req.param("orgId")
        );
        return c.json(groups);
      } catch (err) {
        throw new HTTPException(500, {
          message: "Error getting permission groups: " + err,
        });
      }
    }
  );
}
