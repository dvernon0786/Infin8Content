export default function PricingComparison() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-20">
      <h2 className="text-2xl font-medium text-neutral-900 mb-6 font-poppins">
        Compare plans
      </h2>

      <div className="overflow-x-auto bg-white border border-neutral-200 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="p-4 text-left">Feature</th>
              <th className="p-4">Starter</th>
              <th className="p-4">Pro</th>
              <th className="p-4">Agency</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-4">Articles / month</td>
              <td className="p-4">10</td>
              <td className="p-4">50</td>
              <td className="p-4">150</td>
            </tr>
            <tr className="border-t">
              <td className="p-4">Team members</td>
              <td className="p-4">1</td>
              <td className="p-4">3</td>
              <td className="p-4">Unlimited</td>
            </tr>
            <tr className="border-t">
              <td className="p-4">Projects</td>
              <td className="p-4">1</td>
              <td className="p-4">5</td>
              <td className="p-4">Unlimited</td>
            </tr>
            <tr className="border-t">
              <td className="p-4">CMS connections</td>
              <td className="p-4">1</td>
              <td className="p-4">3</td>
              <td className="p-4">Unlimited</td>
            </tr>
            <tr className="border-t">
              <td className="p-4">Image storage</td>
              <td className="p-4">5 GB</td>
              <td className="p-4">25 GB</td>
              <td className="p-4">100 GB</td>
            </tr>
            <tr className="border-t">
              <td className="p-4">API calls / month</td>
              <td className="p-4">100</td>
              <td className="p-4">1,000</td>
              <td className="p-4">Unlimited</td>
            </tr>
            <tr className="border-t">
              <td className="p-4">Support response time</td>
              <td className="p-4">48h</td>
              <td className="p-4">24h</td>
              <td className="p-4">4h</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
