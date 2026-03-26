import { Prisma } from "@prisma/client";

export type AuditTargetType = "comment" | "user" | "post" | "system";

export function createAuditLogInput(input: {
  actorUserId?: string | null;
  action: string;
  targetType: AuditTargetType;
  targetId: string;
  meta?: Prisma.InputJsonValue;
}): Prisma.AuditLogCreateInput {
  const actorUserId = input.actorUserId?.trim();

  return {
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    ...(typeof input.meta === "undefined" ? {} : { meta: input.meta }),
    ...(actorUserId ? { actorUser: { connect: { id: actorUserId } } } : {}),
  };
}
