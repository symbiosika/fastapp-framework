import { getDb } from "../db/db-connection";
import { eq, and } from "drizzle-orm";
import {
  userSpecificData,
  appSpecificData,
  organisationSpecificData,
  teamSpecificData,
  type UserSpecificDataInsert,
  type AppSpecificDataInsert,
  type OrganisationSpecificDataInsert,
  type TeamSpecificDataInsert,
  type UserSpecificDataSelect,
  type AppSpecificDataSelect,
  type OrganisationSpecificDataSelect,
  type TeamSpecificDataSelect,
} from "../db/schema/additional-data";

// User Specific Data CRUD
export const createUserSpecificData = async (data: UserSpecificDataInsert) => {
  const result = await getDb()
    .insert(userSpecificData)
    .values(data)
    .returning();
  return result[0];
};

export const getUserSpecificData = async (id: string) => {
  const data = await getDb()
    .select()
    .from(userSpecificData)
    .where(eq(userSpecificData.id, id));
  return data[0];
};

export const getUserSpecificDataByKey = async (userId: string, key: string) => {
  const data = await getDb()
    .select()
    .from(userSpecificData)
    .where(
      and(eq(userSpecificData.userId, userId), eq(userSpecificData.key, key))
    );
  return data[0];
};

export const updateUserSpecificData = async (
  id: string,
  data: Partial<UserSpecificDataSelect>
) => {
  const result = await getDb()
    .update(userSpecificData)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(userSpecificData.id, id))
    .returning();
  return result[0];
};

export const deleteUserSpecificData = async (id: string) => {
  await getDb().delete(userSpecificData).where(eq(userSpecificData.id, id));
};

// App Specific Data CRUD
export const createAppSpecificData = async (data: AppSpecificDataInsert) => {
  const result = await getDb().insert(appSpecificData).values(data).returning();
  return result[0];
};

export const getAppSpecificData = async (id: string) => {
  const data = await getDb()
    .select()
    .from(appSpecificData)
    .where(eq(appSpecificData.id, id));
  return data[0];
};

export const getAppSpecificDataByKey = async (key: string, name: string) => {
  const data = await getDb()
    .select()
    .from(appSpecificData)
    .where(and(eq(appSpecificData.key, key), eq(appSpecificData.name, name)));
  return data[0];
};

export const updateAppSpecificData = async (
  id: string,
  data: Partial<AppSpecificDataSelect>
) => {
  const result = await getDb()
    .update(appSpecificData)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(appSpecificData.id, id))
    .returning();
  return result[0];
};

export const deleteAppSpecificData = async (id: string) => {
  await getDb().delete(appSpecificData).where(eq(appSpecificData.id, id));
};

// Organisation Specific Data CRUD
export const createOrganisationSpecificData = async (
  data: OrganisationSpecificDataInsert
) => {
  const result = await getDb()
    .insert(organisationSpecificData)
    .values(data)
    .returning();
  return result[0];
};

export const getOrganisationSpecificData = async (id: string) => {
  const data = await getDb()
    .select()
    .from(organisationSpecificData)
    .where(eq(organisationSpecificData.id, id));
  return data[0];
};

export const getOrganisationSpecificDataByCategory = async (
  category: string,
  name: string
) => {
  const data = await getDb()
    .select()
    .from(organisationSpecificData)
    .where(
      and(
        eq(organisationSpecificData.category, category),
        eq(organisationSpecificData.name, name)
      )
    );
  return data[0];
};

export const updateOrganisationSpecificData = async (
  id: string,
  data: Partial<OrganisationSpecificDataSelect>
) => {
  const result = await getDb()
    .update(organisationSpecificData)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(organisationSpecificData.id, id))
    .returning();
  return result[0];
};

export const deleteOrganisationSpecificData = async (id: string) => {
  await getDb()
    .delete(organisationSpecificData)
    .where(eq(organisationSpecificData.id, id));
};

// Team Specific Data CRUD
export const createTeamSpecificData = async (data: TeamSpecificDataInsert) => {
  const result = await getDb()
    .insert(teamSpecificData)
    .values(data)
    .returning();
  return result[0];
};

export const getTeamSpecificData = async (id: string) => {
  const data = await getDb()
    .select()
    .from(teamSpecificData)
    .where(eq(teamSpecificData.id, id));
  return data[0];
};

export const getTeamSpecificDataByKey = async (
  teamId: string,
  category: string,
  key: string
) => {
  const data = await getDb()
    .select()
    .from(teamSpecificData)
    .where(
      and(
        eq(teamSpecificData.teamId, teamId),
        eq(teamSpecificData.category, category),
        eq(teamSpecificData.key, key)
      )
    );
  return data[0];
};

export const updateTeamSpecificData = async (
  id: string,
  data: Partial<TeamSpecificDataSelect>
) => {
  const result = await getDb()
    .update(teamSpecificData)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(teamSpecificData.id, id))
    .returning();
  return result[0];
};

export const deleteTeamSpecificData = async (id: string) => {
  await getDb().delete(teamSpecificData).where(eq(teamSpecificData.id, id));
};
