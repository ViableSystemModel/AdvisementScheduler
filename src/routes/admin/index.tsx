import { AdminPage } from '@/components/AdminPage';
import { createFileRoute } from '@tanstack/react-router'
import { H1 } from '@/components/ui/typography';
import { SemesterList } from '@/components/semesters/SemesterList';
import { SemesterCreationModal } from '@/components/semesters/SemesterCreationModal';

export const Route = createFileRoute('/admin/')({
  component: AdminLayout,
})

function AdminLayout() {
  
  return (
    <AdminPage>
      <H1>Semesters</H1>
      <SemesterCreationModal/>
      <SemesterList/>
    </AdminPage>
  )
}
