import AdminTable from '../../components/admin/AdminTable';
import AdminLayout from '../../layouts/AdminLayout';
import { useAdminListing } from './CinemasPage';

function propertiesSummary(properties) {
    if (!properties || Object.keys(properties).length === 0) {
        return '—';
    }

    return Object.entries(properties)
        .map(([key, value]) => {
            if (value == null) {
                return `${key}: —`;
            }
            if (typeof value === 'object') {
                return `${key}: ${JSON.stringify(value)}`;
            }

            return `${key}: ${value}`;
        })
        .join(' · ');
}

export default function AuditLogsPage() {
    const listing = useAdminListing('audit-logs', {
        search: '',
        page: 1,
        action: '',
        from: '',
        to: '',
        sort: 'created_at',
        direction: 'desc',
    });

    return (
        <AdminLayout header="Audit Logs">
            <AdminTable
                title="Security and admin activity"
                description="Shows check-ins, role changes, settings updates, password resets, lockouts, and other audited admin actions. Sensitive values like tokens are hidden."
                listing={listing.payload?.listing}
                query={listing.query}
                onQuery={listing.setQuery}
                loading={listing.loading}
                error={listing.error}
                filters={[
                    {
                        key: 'action',
                        label: 'Any action',
                        options: (listing.payload?.actions || []).map((action) => ({
                            value: action.value,
                            label: action.label,
                        })),
                    },
                    { key: 'from', label: 'From', type: 'date' },
                    { key: 'to', label: 'To', type: 'date' },
                ]}
                columns={[
                    { key: 'created_at', label: 'When' },
                    { key: 'action_label', label: 'Action' },
                    {
                        key: 'actor',
                        label: 'Actor',
                        render: (row) => (
                            <span>
                                {row.actor}
                                {row.actor_email ? <span className="block text-xs text-gray-500">{row.actor_email}</span> : null}
                            </span>
                        ),
                    },
                    { key: 'subject', label: 'Subject', render: (row) => row.subject || '—' },
                    {
                        key: 'properties',
                        label: 'Details',
                        render: (row) => (
                            <span className="max-w-xs truncate block text-xs text-gray-600" title={propertiesSummary(row.properties)}>
                                {propertiesSummary(row.properties)}
                            </span>
                        ),
                    },
                    { key: 'ip', label: 'IP', render: (row) => row.ip || '—' },
                ]}
            />
        </AdminLayout>
    );
}
