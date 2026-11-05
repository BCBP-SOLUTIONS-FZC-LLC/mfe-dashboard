import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useT } from '@bcbp-solutions-fzc-llc/frontend-sdk/react'
import { useMemberAccess } from '../hooks/useMemberAccess'
import { APP_ID } from '../i18n'
import type { AppShellOutletContext } from '../layouts/appShellContext'
import { dashBorderClass, dashSurfaceClass } from '../theme/themeMode'

type ManagedUser = {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: 'Active' | 'Invited' | 'Disabled'
}

const MOCK_USERS: ManagedUser[] = [
  {
    id: '1',
    name: 'Balaji Selvarangam',
    email: 'balaji.selvarangam@bcbpsolutions.com',
    role: 'Admin',
    department: 'IT Department',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Arjun R',
    email: 'arjun.r@bcbpsolutions.com',
    role: 'Approver',
    department: 'Engineering',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Priya N',
    email: 'priya.n@bcbpsolutions.com',
    role: 'Reviewer',
    department: 'Operations',
    status: 'Active',
  },
  {
    id: '4',
    name: 'Samuel K',
    email: 'samuel.k@bcbpsolutions.com',
    role: 'Lead',
    department: 'Engineering',
    status: 'Invited',
  },
  {
    id: '5',
    name: 'Meera V',
    email: 'meera.v@bcbpsolutions.com',
    role: 'Reviewer',
    department: 'IT Department',
    status: 'Disabled',
  },
]

function statusBadgeClass(status: ManagedUser['status']) {
  switch (status) {
    case 'Active':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/50 dark:bg-transparent dark:text-emerald-300'
    case 'Invited':
      return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/50 dark:bg-transparent dark:text-amber-200'
    case 'Disabled':
      return 'border-gray-200 bg-gray-100 text-gray-600 dark:border-aura-border dark:bg-transparent dark:text-aura-muted'
  }
}

export default function UserManagementPage() {
  const { search } = useOutletContext<AppShellOutletContext>()
  const t = useT(APP_ID)
  // Everyone who sees the page may view; only tenant_admin and tenant_owner get the actions.
  const { canManage } = useMemberAccess()

  const users = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) {
      return MOCK_USERS
    }
    return MOCK_USERS.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q),
    )
  }, [search])

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-aura-text">{t('users.title')}</h1>
          <p className="text-sm text-aura-muted">{t('users.subtitle')}</p>
        </div>
        {canManage ? (
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-aura-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            {t('users.invite')}
          </button>
        ) : null}
      </div>

      <div className={`overflow-hidden rounded-xl border shadow-sm ${dashBorderClass} ${dashSurfaceClass}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-start text-sm">
            <thead>
              <tr className={`border-b text-xs font-semibold uppercase tracking-wide text-aura-muted ${dashBorderClass}`}>
                <th className="px-4 py-3 font-semibold">{t('users.col.name')}</th>
                <th className="px-4 py-3 font-semibold">{t('users.col.email')}</th>
                <th className="px-4 py-3 font-semibold">{t('users.col.role')}</th>
                <th className="px-4 py-3 font-semibold">{t('users.col.department')}</th>
                <th className="px-4 py-3 font-semibold">{t('users.col.status')}</th>
                {canManage ? (
                  <th className="px-4 py-3 font-semibold text-end">{t('users.col.actions')}</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-4 py-10 text-center text-sm text-aura-muted">
                    {t('users.empty')}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b last:border-b-0 ${dashBorderClass} hover:bg-aura-hover/60`}
                  >
                    <td className="px-4 py-3 font-medium text-aura-text">{user.name}</td>
                    <td className="px-4 py-3 text-aura-muted">{user.email}</td>
                    <td className="px-4 py-3 text-aura-text">{user.role}</td>
                    <td className="px-4 py-3 text-aura-text">{user.department}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(user.status)}`}
                      >
                        {t(`users.status.${user.status}`)}
                      </span>
                    </td>
                    {canManage ? (
                      <td className="px-4 py-3 text-end">
                        <button
                          type="button"
                          className="cursor-pointer text-sm font-semibold text-aura-secondary hover:underline"
                        >
                          {t('users.edit')}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
