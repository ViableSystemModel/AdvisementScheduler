import { Link, useLocation } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Fragment } from 'react'
import { capitalizeFirstLetter } from '@/lib/utils'

const routeNameMap: Record<string, string> = {
  admin: 'Dashboard',
  // semesters: 'Semesters',
  // students: 'Students',
}

interface AdminBreadcrumbsProps {
  segmentOverrides?: Record<string, string>
}

export function AdminBreadcrumbs({ segmentOverrides = {} }: AdminBreadcrumbsProps) {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1
          const path = `/${pathSegments.slice(0, index + 1).join('/')}`
          // Check overrides first, then routeNameMap, then capitalize the segment
          const name = segmentOverrides[segment] || routeNameMap[segment] || capitalizeFirstLetter(segment)

          return (
            <Fragment key={path}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-semibold">{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={path}>{name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
