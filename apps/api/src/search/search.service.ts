import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import type { SearchQueryDto } from "./dto/search.dto";

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchQueryDto) {
    const { q, limit: limitStr = "5" } = query;
    const limit = Math.min(parseInt(limitStr, 10) || 5, 20);
    const term = q.trim();
    if (!term) return { q, results: {} };

    const [users, documents, meetings, workflows, tasks] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: term, mode: "insensitive" } },
            { lastName: { contains: term, mode: "insensitive" } },
            { displayName: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
          ],
          status: { not: "DEACTIVATED" },
        },
        select: {
          id: true,
          displayName: true,
          email: true,
          role: true,
          avatarUrl: true,
          status: true,
        },
        take: limit,
      }),

      this.prisma.document.findMany({
        where: {
          OR: [{ title: { contains: term, mode: "insensitive" } }],
          status: { not: "ARCHIVED" },
        },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          classification: true,
          createdAt: true,
          author: { select: { displayName: true } },
        },
        take: limit,
      }),

      this.prisma.meeting.findMany({
        where: {
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { location: { contains: term, mode: "insensitive" } },
          ],
          status: { not: "CANCELLED" },
        },
        select: {
          id: true,
          title: true,
          status: true,
          meetingType: true,
          event: { select: { startAt: true, endAt: true } },
          organizer: { select: { displayName: true } },
        },
        take: limit,
      }),

      this.prisma.workflowInstance.findMany({
        where: {
          OR: [{ title: { contains: term, mode: "insensitive" } }],
          status: { not: "CANCELLED" },
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          initiator: { select: { displayName: true } },
        },
        take: limit,
      }),

      this.prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueAt: true,
          assignee: { select: { displayName: true } },
        },
        take: limit,
      }),
    ]);

    // Count non-empty groups for totals
    const totalHits =
      users.length + documents.length + meetings.length + workflows.length + tasks.length;

    return {
      q: term,
      totalHits,
      results: {
        users: { type: "users", label: "Agents", items: users, count: users.length },
        documents: {
          type: "documents",
          label: "Documents",
          items: documents,
          count: documents.length,
        },
        meetings: { type: "meetings", label: "Réunions", items: meetings, count: meetings.length },
        workflows: {
          type: "workflows",
          label: "Workflows",
          items: workflows,
          count: workflows.length,
        },
        tasks: { type: "tasks", label: "Tâches", items: tasks, count: tasks.length },
      },
    };
  }
}
