import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Tawasal — تواصل</title>
        <meta name="description" content="Tawasal (تواصل) — messaging app" />
      </Head>
      <main className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="max-w-3xl mx-auto p-6">
          <header className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-semibold">Tawasal — تواصل</h1>
            <nav>
              <Link href="/auth/signup"><a className="text-sm underline">Sign up / تسجيل</a></Link>
            </nav>
          </header>

          <section className="mt-12">
            <h2 className="text-lg font-medium">Welcome to Tawasal (تواصل)</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300">A messaging platform with email-based registration and unique Tawasal ID for each user.</p>

            <div className="mt-6">
              <Link href="/auth/signup"><a className="px-4 py-2 bg-green-600 text-white rounded">Get started</a></Link>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
