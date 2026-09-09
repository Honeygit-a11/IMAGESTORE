"use client";

import * as React from "react";
import { Crown, Edit3, Eye, Check, X, ShieldCheck } from "lucide-react";

type RoleType = "OWNER" | "EDITOR" | "VIEWER";

interface PermissionRule {
  feature: string;
  owner: boolean;
  editor: boolean;
  viewer: boolean;
  note?: string;
}

const permissionsList: PermissionRule[] = [
  { feature: "View and browse images in gallery", owner: true, editor: true, viewer: true },
  { feature: "Lightbox preview & single image download", owner: true, editor: true, viewer: true },
  { feature: "Filter by tags & search by filename", owner: true, editor: true, viewer: true },
  { feature: "Upload new images (max 10MB, up to 10 batch)", owner: true, editor: true, viewer: false },
  { feature: "Edit or remove tags on images", owner: true, editor: true, viewer: false },
  { feature: "Delete own uploaded images", owner: true, editor: true, viewer: false },
  { feature: "Delete ANY member's image", owner: true, editor: false, viewer: false },
  { feature: "Access Trash bin & restore deleted images", owner: true, editor: false, viewer: false },
  { feature: "View uploader identity & upload timestamp", owner: true, editor: false, viewer: false },
  { feature: "Invite & remove workspace members (max 3)", owner: true, editor: false, viewer: false },
  { feature: "Change member roles (Editor ↔ Viewer)", owner: true, editor: false, viewer: false },
  { feature: "Initiate ownership transfer to member", owner: true, editor: false, viewer: false },
  { feature: "View workspace audit activity logs", owner: true, editor: false, viewer: false },
  { feature: "Destructive workspace deletion", owner: true, editor: false, viewer: false },
];

export function RoleMatrix() {
  const [selectedRole, setSelectedRole] = React.useState<RoleType>("OWNER");

  return (
    <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-6 sm:p-10 shadow-lg backdrop-blur-sm">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
          <ShieldCheck className="h-4 w-4" />
          Role-Based Access Control (RBAC)
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Strict 3-Tier Workspace Permissions
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 mt-2">
          Every workspace supports up to 3 total members. Select a role below to highlight its exact capability scope.
        </p>

        {/* Role Selector Tabs */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 mt-6 gap-1 border border-zinc-200/60 dark:border-zinc-700/50">
          <button
            onClick={() => setSelectedRole("OWNER")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === "OWNER"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Crown className="h-4 w-4 text-amber-500" />
            OWNER
          </button>
          <button
            onClick={() => setSelectedRole("EDITOR")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === "EDITOR"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Edit3 className="h-4 w-4 text-blue-500" />
            EDITOR
          </button>
          <button
            onClick={() => setSelectedRole("VIEWER")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedRole === "VIEWER"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Eye className="h-4 w-4 text-zinc-400" />
            VIEWER
          </button>
        </div>
      </div>

      {/* Interactive Permission Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold">
              <th className="pb-3 px-3">Permission / Capability</th>
              <th
                className={`pb-3 px-3 text-center transition-colors ${
                  selectedRole === "OWNER" ? "text-amber-600 dark:text-amber-400 font-bold" : ""
                }`}
              >
                Owner
              </th>
              <th
                className={`pb-3 px-3 text-center transition-colors ${
                  selectedRole === "EDITOR" ? "text-blue-600 dark:text-blue-400 font-bold" : ""
                }`}
              >
                Editor
              </th>
              <th
                className={`pb-3 px-3 text-center transition-colors ${
                  selectedRole === "VIEWER" ? "text-zinc-900 dark:text-white font-bold" : ""
                }`}
              >
                Viewer
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {permissionsList.map((item, idx) => (
              <tr
                key={idx}
                className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors ${
                  (selectedRole === "OWNER" && item.owner) ||
                  (selectedRole === "EDITOR" && item.editor) ||
                  (selectedRole === "VIEWER" && item.viewer)
                    ? "bg-blue-50/30 dark:bg-blue-950/10"
                    : ""
                }`}
              >
                <td className="py-3 px-3 font-medium text-zinc-800 dark:text-zinc-200">
                  {item.feature}
                </td>
                <td className="py-3 px-3 text-center">
                  {item.owner ? (
                    <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {item.editor ? (
                    <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {item.viewer ? (
                    <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-zinc-300 dark:text-zinc-700 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
