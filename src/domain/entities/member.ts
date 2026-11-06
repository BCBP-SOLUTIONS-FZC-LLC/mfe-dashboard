/** A tenant member as User management lists it. */
export type Member = {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: 'Active' | 'Invited' | 'Disabled'
}
