import { redirect } from 'next/navigation'

export default function UpgradePage() {
  // The main payment page handles the plan selection and checkout
  // for both initial signup and upgrades.
  redirect('/payment')
}
