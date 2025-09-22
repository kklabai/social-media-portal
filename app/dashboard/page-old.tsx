"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, Shield, Users, Activity, Clock, BarChart3 } from "lucide-react";

interface DashboardStats {
  ecosystems: number;
  platforms: number;
  users: number;
  activeLinks: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    ecosystems: 0,
    platforms: 0,
    users: 0,
    activeLinks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; role?: string } | null>(null);

  useEffect(() => {
    // Check authentication
    fetch("/api/auth/session")
      .then((res) => {
        if (!res.ok) {
          router.push("/");
          return null;
        }
        return res.json();
      })
      .then((session) => {
        if (session) {
          setUser(session.user);
          // Set all stats to 0 - no fake data
          setStats({
            ecosystems: 0,
            platforms: 0,
            users: 0,
            activeLinks: 0,
          });
          setLoading(false);
          
          // Load REAL data from API
          fetch('/api/ecosystems')
            .then(res => res.json())
            .then(data => {
              const ecosystemCount = data.list?.length || 0;
              setStats(prev => ({
                ...prev,
                ecosystems: ecosystemCount
              }));
            })
            .catch(console.error);
        }
      })
      .catch((error) => {
        console.error("Error loading session:", error);
        router.push("/");
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Ecosystems",
      value: stats.ecosystems,
      icon: Globe,
      color: "bg-blue-100",
      iconColor: "#1a73e8",
      href: "/ecosystems",
    },
    {
      title: "Social Platforms", 
      value: stats.platforms,
      icon: Shield,
      color: "bg-green-100",
      iconColor: "#1e8e3e",
      href: "/ecosystems",
    },
    {
      title: "Active Users",
      value: stats.users,
      icon: Users,
      color: "bg-purple-100",
      iconColor: "#7c3aed",
      href: "/users",
    },
    {
      title: "Active Links",
      value: stats.activeLinks,
      icon: Activity,
      color: "bg-orange-100",
      iconColor: "#f9ab00",
      href: "/ecosystems",
    },
  ];

  interface Activity {
    icon: typeof Clock;
    text: string;
    time: string;
    color: string;
  }
  const recentActivities: Activity[] = []; // No fake data

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-light text-gray-800">Dashboard</h1>
        {user?.name && (
          <p className="text-sm text-gray-600 mt-1">
            Welcome back, {user.name}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} href={stat.href} className="stat-card">
              <div className={`stat-icon ${stat.color} bg-opacity-10`}>
                <Icon className="h-6 w-6" style={{ color: stat.iconColor }} />
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.title}</div>
            </Link>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Card */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-light text-gray-800">Recent Activity</h3>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{activity.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No recent activity. Start by creating an ecosystem.
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-light text-gray-800">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Link
              href="/ecosystems/new"
              className="btn btn-primary w-full justify-center"
            >
              Create New Ecosystem
            </Link>
            <Link
              href="/ecosystems"
              className="btn btn-light w-full justify-center"
            >
              Manage Ecosystems
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/users"
                className="btn btn-light w-full justify-center"
              >
                Manage Users
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Platform Status Overview */}
      <div className="card mt-6">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-light text-gray-800">Platform Status Overview</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-green-50">
            <p className="text-3xl font-light text-green-600">{stats.activeLinks}</p>
            <p className="text-sm text-gray-600 mt-1">Active Links</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-orange-50">
            <p className="text-3xl font-light text-orange-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Need Attention</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-red-50">
            <p className="text-3xl font-light text-red-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Inactive</p>
          </div>
        </div>
      </div>
    </div>
  );
}