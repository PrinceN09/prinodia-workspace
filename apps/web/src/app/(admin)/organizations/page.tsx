"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AdminTopBar } from "@/components/layout/AdminTopBar";
import { PermissionGate } from "@/components/layout/PermissionGate";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { PageSpinner } from "@/components/ui/Spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { PERMS } from "@/lib/permissions";
import { useListQuery } from "@/lib/use-list-query";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrganizationType =
  | "GOVERNMENT"
  | "ENTERPRISE"
  | "EDUCATION"
  | "HEALTHCARE"
  | "NGO"
  | "CHURCH"
  | "NON_PROFIT"
  | "OTHER";

type OrganizationStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ARCHIVED";

interface Organization {
  id: string;
  name: string;
  code: string;
  type: OrganizationType;
  status: OrganizationStatus;
  description: string | null;
  email: string | null;
  city: string | null;
  country: string | null;
  _count?: { ministries: number; departments: number; users: number };
}

// ─── Labels ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<OrganizationType, string> = {
  GOVERNMENT: "Gouvernement",
  ENTERPRISE: "Entreprise",
  EDUCATION: "Éducation",
  HEALTHCARE: "Santé",
  NGO: "ONG",
  CHURCH: "Église",
  NON_PROFIT: "Sans but lucratif",
  OTHER: "Autre",
};

const STATUS_VARIANTS: Record<OrganizationStatus, "green" | "gray" | "yellow" | "red"> = {
  ACTIVE: "green",
  INACTIVE: "gray",
  SUSPENDED: "yellow",
  ARCHIVED: "red",
};

const STATUS_LABELS: Record<OrganizationStatus, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  SUSPENDED: "Suspendu",
  ARCHIVED: "Archivé",
};

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Nom requis").max(255),
  code: z.string().min(2, "Code requis").max(100),
  type: z.enum([
    "GOVERNMENT",
    "ENTERPRISE",
    "EDUCATION",
    "HEALTHCARE",
    "NGO",
    "CHURCH",
    "NON_PROFIT",
    "OTHER",
  ]),
  description: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  city: z.string().optional(),
  country: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Page component ───────────────────────────────────────────────────────────

export default function OrganizationsPage() {
  const list = useListQuery<Organization>({
    endpoint: "/v1/organizations",
    queryKey: "organizations",
  });
  const [createOpen, setCreateOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "OTHER" },
  });

  const onSubmit = async (values: FormValues) => {
    await list.createMutation.mutateAsync({
      name: values.name,
      code: values.code.toUpperCase(),
      type: values.type,
      description: values.description ?? null,
      email: values.email || null,
      city: values.city ?? null,
      country: values.country ?? null,
    });
    form.reset();
    setCreateOpen(false);
  };

  if (list.isLoading) return <PageSpinner />;

  return (
    <>
      <AdminTopBar
        title="Organisations"
        subtitle={`${list.total ?? 0} organisation${(list.total ?? 0) !== 1 ? "s" : ""}`}
        actions={
          <PermissionGate permission={PERMS.ORGANIZATION_CREATE}>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              Nouvelle organisation
            </Button>
          </PermissionGate>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <SearchInput
          placeholder="Rechercher une organisation…"
          value={list.search}
          onChange={list.handleSearch}
        />
      </div>

      {/* Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Nom</TableHeaderCell>
            <TableHeaderCell>Code</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Statut</TableHeaderCell>
            <TableHeaderCell>Localisation</TableHeaderCell>
            <TableHeaderCell>Entités</TableHeaderCell>
            <TableHeaderCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {list.data.length === 0 ? (
            <TableEmpty message="Aucune organisation trouvée." />
          ) : (
            list.data.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="font-medium text-primary-400 hover:text-primary-300"
                  >
                    {org.name}
                  </Link>
                  {org.description && (
                    <p className="mt-0.5 text-xs text-navy-400 line-clamp-1">{org.description}</p>
                  )}
                </TableCell>
                <TableCell>
                  <code className="rounded bg-navy-800 px-1.5 py-0.5 text-xs text-navy-300">
                    {org.code}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant="blue">{TYPE_LABELS[org.type] ?? org.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[org.status]}>
                    {STATUS_LABELS[org.status] ?? org.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-navy-300">
                  {[org.city, org.country].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-sm text-navy-400">
                  {org._count
                    ? `${org._count.departments} dépts · ${org._count.users} agents`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="text-xs text-primary-400 hover:underline"
                  >
                    Détails →
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="mt-4">
        <Pagination
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          limit={20}
          onPageChange={list.setPage}
        />
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Nouvelle organisation">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nom *"
            {...form.register("name")}
            error={form.formState.errors.name?.message}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Code *"
              placeholder="EX: MINFIN"
              {...form.register("code")}
              error={form.formState.errors.code?.message}
            />
            <div>
              <label className="mb-1 block text-xs font-medium text-navy-300">Type *</label>
              <select
                {...form.register("type")}
                className="w-full rounded border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
              >
                <option value="GOVERNMENT">Gouvernement</option>
                <option value="ENTERPRISE">Entreprise</option>
                <option value="EDUCATION">Éducation</option>
                <option value="HEALTHCARE">Santé</option>
                <option value="NGO">ONG</option>
                <option value="CHURCH">Église</option>
                <option value="NON_PROFIT">Sans but lucratif</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
          </div>
          <Input
            label="Description"
            {...form.register("description")}
          />
          <Input
            label="Email"
            type="email"
            {...form.register("email")}
            error={form.formState.errors.email?.message}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ville" {...form.register("city")} />
            <Input label="Pays" {...form.register("country")} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={list.createMutation.isPending}>
              Créer
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
