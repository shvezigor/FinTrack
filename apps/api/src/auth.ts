import { FastifyReply, FastifyRequest } from "fastify";
import { authenticateDashboardRequest } from "@resource-manager/server";

export async function requireDashboardAuth(request: FastifyRequest, reply: FastifyReply) {
  const user = await authenticateDashboardRequest({
    authorization: request.headers.authorization,
    dashboardPassword: request.headers["x-dashboard-password"],
  });

  if (!user) {
    await reply.status(401).send({ error: "Unauthorized" });
    return false;
  }

  const resolvedRole =
    ("role" in user && typeof user.role === "string"
      ? user.role
      : user.roles.find((assignment) => assignment.role?.key)?.role.key) ?? "USER";

  (request as FastifyRequest & { userId?: string }).userId = user.id;
  (request as FastifyRequest & { userRole?: string }).userRole = resolvedRole;
  return true;
}

export function getRequestUserId(request: FastifyRequest) {
  return (request as FastifyRequest & { userId?: string }).userId;
}

export function getRequestUserRole(request: FastifyRequest) {
  return ((request as FastifyRequest & { userRole?: string }).userRole ?? "USER").toUpperCase();
}

export async function requireDashboardAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!(await requireDashboardAuth(request, reply))) {
    return false;
  }

  const role = getRequestUserRole(request);
  if (role !== "OWNER" && role !== "ADMIN") {
    await reply.status(403).send({ error: "Forbidden" });
    return false;
  }

  return true;
}
