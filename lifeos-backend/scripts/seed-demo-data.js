/**
 * LifeOS — Comprehensive Demo Data Seed Script
 * Creates dedicated demo user (demo@lifeos.local) with interconnected demo data:
 * Tasks, Habits, 365-Day Habit Logs, Notes, Journal Entries, Calendar Events, Settings.
 */

const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');

// Force Google Public DNS for MongoDB Atlas SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/modules/users/user.model');
const Task = require('../src/modules/tasks/task.model');
const { Habit, HabitLog } = require('../src/modules/habits/habit.model');
const Note = require('../src/modules/notes/note.model');
const Journal = require('../src/modules/journal/journal.model');
const Event = require('../src/modules/calendar/event.model');
const Settings = require('../src/modules/settings/settings.model');

const DEMO_EMAIL = 'demo@lifeos.local';
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || 'DemoPassword123!';

async function seedDemoData() {
  console.log('====================================================');
  console.log('🌱 LIFEOS — SEEDING COMPREHENSIVE DEMO DATA');
  console.log('====================================================\n');

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }

    console.log('Connecting to MongoDB database...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log('✅ Connected to MongoDB.\n');

    // 1. Create or Find Demo User
    let demoUser = await User.findOne({ email: DEMO_EMAIL });
    if (demoUser) {
      console.log(`[1/8] Demo user found (${DEMO_EMAIL}). Clearing previous demo records...`);
      // Delete existing demo records cleanly
      await Promise.all([
        Task.deleteMany({ userId: demoUser._id }),
        Habit.deleteMany({ userId: demoUser._id }),
        HabitLog.deleteMany({ userId: demoUser._id }),
        Note.deleteMany({ userId: demoUser._id }),
        Journal.deleteMany({ userId: demoUser._id }),
        Event.deleteMany({ userId: demoUser._id }),
        Settings.deleteMany({ userId: demoUser._id }),
      ]);
      console.log('  Cleaned existing demo records.');

      demoUser.name = 'Varsh Demo';
      demoUser.username = 'varshdemo';
      demoUser.bio = 'Building better habits, one day at a time.';
      demoUser.role = 'user';
      demoUser.isEmailVerified = true;
      await demoUser.save({ validateBeforeSave: false });
    } else {
      console.log(`[1/8] Creating new demo user (${DEMO_EMAIL})...`);
      demoUser = await User.create({
        name: 'Varsh Demo',
        username: 'varshdemo',
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        bio: 'Building better habits, one day at a time.',
        role: 'user',
        isEmailVerified: true,
      });
    }

    const userId = demoUser._id;
    console.log(`  Demo User ID: ${userId}\n`);

    // 2. Seed Tasks
    console.log('[2/8] Seeding 12 Demo Tasks...');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now.getTime() - 86400000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 86400000);
    const tomorrow = new Date(now.getTime() + 86400000);
    const inTwoDays = new Date(now.getTime() + 2 * 86400000);
    const inThreeDays = new Date(now.getTime() + 3 * 86400000);

    const taskDocs = [
      {
        userId,
        title: 'Complete DSA Array Revision',
        description: 'Solve 5 Medium Array problems on LeetCode / GFG.',
        status: 'done',
        priority: 'high',
        category: 'study',
        dueDate: now,
        completedAt: now,
        tags: ['dsa', 'coding'],
        estimatedTime: 60,
      },
      {
        userId,
        title: 'Build LifeOS authentication flow',
        description: 'Implement JWT OTP password reset and signup welcome email.',
        status: 'done',
        priority: 'urgent',
        category: 'work',
        dueDate: now,
        completedAt: now,
        tags: ['lifeos', 'auth', 'backend'],
        estimatedTime: 120,
      },
      {
        userId,
        title: 'Practice Java recursion problems',
        description: 'Focus on Backtracking, Subsets, and Permutations.',
        status: 'in_progress',
        priority: 'high',
        category: 'study',
        dueDate: now,
        tags: ['java', 'dsa'],
        estimatedTime: 90,
      },
      {
        userId,
        title: 'Review System Design Patterns',
        description: 'Study Load Balancers, Caching, and Database Sharding.',
        status: 'todo',
        priority: 'medium',
        category: 'study',
        dueDate: now,
        tags: ['system-design', 'career'],
        estimatedTime: 45,
      },
      {
        userId,
        title: 'Update GitHub README & Documentation',
        description: 'Add setup instructions and API architecture diagrams.',
        status: 'todo',
        priority: 'medium',
        category: 'work',
        dueDate: tomorrow,
        tags: ['git', 'docs'],
        estimatedTime: 30,
      },
      {
        userId,
        title: 'Prepare Mock Interview Questions',
        description: 'Review Behavioral questions and System Design topics.',
        status: 'todo',
        priority: 'high',
        category: 'study',
        dueDate: inTwoDays,
        tags: ['interview', 'career'],
        estimatedTime: 60,
      },
      {
        userId,
        title: 'Read 20 pages of Technical Book',
        description: 'Read Designing Data-Intensive Applications Chapter 4.',
        status: 'todo',
        priority: 'low',
        category: 'personal',
        dueDate: inThreeDays,
        tags: ['reading', 'learning'],
        estimatedTime: 40,
      },
      {
        userId,
        title: 'Push project changes to GitHub',
        description: 'Commit recent code edits and push to main branch.',
        status: 'todo',
        priority: 'medium',
        category: 'work',
        dueDate: twoDaysAgo, // Overdue task
        tags: ['git'],
        estimatedTime: 20,
      },
      {
        userId,
        title: 'Set up LifeOS MongoDB Schema',
        description: 'Define indexing and Mongoose models for habits & analytics.',
        status: 'done',
        priority: 'high',
        category: 'work',
        dueDate: yesterday,
        completedAt: yesterday,
        tags: ['database', 'lifeos'],
        estimatedTime: 90,
      },
      {
        userId,
        title: 'Create Responsive Sidebar Layout',
        description: 'Ensure clean navigation icons and mobile responsive support.',
        status: 'done',
        priority: 'medium',
        category: 'work',
        dueDate: yesterday,
        completedAt: yesterday,
        tags: ['frontend', 'css'],
        estimatedTime: 45,
      },
    ];

    await Task.insertMany(taskDocs);
    console.log(`  Created ${taskDocs.length} tasks.`);

    // 3. Seed Habits & 365-Day Log History
    console.log('\n[3/8] Seeding 12 Habits and 365 Days of Habit Logs...');
    const habitsData = [
      { name: 'Drink 4L Water', category: 'health', icon: '💧', color: '#0F8B8D', frequency: 'daily' },
      { name: 'DSA Practice', category: 'productivity', icon: '⚡', color: '#f97316', frequency: 'daily' },
      { name: 'Project Development', category: 'productivity', icon: '💻', color: '#0F8B8D', frequency: 'daily' },
      { name: 'GitHub Contribution', category: 'productivity', icon: '🎨', color: '#3b82f6', frequency: 'daily' },
      { name: 'Java Practice', category: 'learning', icon: '🧠', color: '#ec4899', frequency: 'daily' },
      { name: 'Read Technical Content', category: 'learning', icon: '📚', color: '#10b981', frequency: 'daily' },
      { name: 'Meditation', category: 'mindfulness', icon: '🧘', color: '#8b5cf6', frequency: 'daily' },
      { name: 'Journal Writing', category: 'mindfulness', icon: '✍️', color: '#0F8B8D', frequency: 'daily' },
      { name: 'Morning Walk', category: 'fitness', icon: '🏃', color: '#10b981', frequency: 'daily' },
      { name: 'Exercise', category: 'fitness', icon: '💪', color: '#ef4444', frequency: 'daily' },
      { name: 'Sleep Before 11 PM', category: 'health', icon: '🌙', color: '#8b5cf6', frequency: 'daily' },
      { name: 'LinkedIn Learning', category: 'learning', icon: '🌐', color: '#3b82f6', frequency: 'weekly' },
    ];

    const createdHabits = [];
    for (const h of habitsData) {
      const habit = await Habit.create({ userId, ...h });
      createdHabits.push(habit);
    }

    // Generate 365-day check-in logs for charts & heatmaps
    const habitLogs = [];
    for (let dayOffset = 365; dayOffset >= 0; dayOffset--) {
      const logDate = new Date(now.getTime() - dayOffset * 86400000);
      logDate.setHours(12, 0, 0, 0);

      // Higher completion probability in recent 30 days
      const isRecent = dayOffset <= 30;
      const isWeekend = logDate.getDay() === 0 || logDate.getDay() === 6;

      for (const habit of createdHabits) {
        let completionProbability = 0.75;
        if (habit.name === 'Drink 4L Water' || habit.name === 'DSA Practice') {
          completionProbability = isRecent ? 0.95 : 0.85;
        } else if (isWeekend) {
          completionProbability = 0.60;
        }

        if (Math.random() < completionProbability || (isRecent && dayOffset <= 14)) {
          habitLogs.push({
            habitId: habit._id,
            userId,
            date: logDate,
            completed: true,
          });
        }
      }
    }

    await HabitLog.insertMany(habitLogs);
    console.log(`  Created ${createdHabits.length} habits with ${habitLogs.length} historical logs.`);

    // 4. Seed Notes
    console.log('\n[4/8] Seeding 10 Demo Notes...');
    const notesDocs = [
      {
        userId,
        title: 'DSA Revision Plan',
        folder: 'DSA',
        tags: ['dsa', 'coding', 'algorithms'],
        color: '#0F8B8D',
        isPinned: true,
        content: `### DSA Roadmap & Key Topics\n\n1. **Arrays & Two Pointers**: Sliding Window, Prefix Sum, Cadane's Algo.\n2. **Strings & HashMaps**: Anagrams, Substring matching.\n3. **Linked Lists**: Fast & Slow pointers, Reverse in groups.\n4. **Stacks & Queues**: Monotonic Stack, Sliding Window Maximum.\n5. **Trees & Graphs**: BFS, DFS, Dijkstra, Union-Find.`,
      },
      {
        userId,
        title: 'React & Next.js Learning Notes',
        folder: 'React',
        tags: ['frontend', 'react', 'nextjs'],
        color: '#3b82f6',
        isPinned: true,
        content: `### Core React Principles\n\n- **Components**: Pure, reusable functions returning JSX.\n- **State vs Props**: Props are read-only inputs, State is local mutable state.\n- **Hooks**: useState, useEffect, useMemo, useCallback, useRef.\n- **Next.js 16**: Turbopack compiler, Server Components, Route Handlers.`,
      },
      {
        userId,
        title: 'LifeOS Project Architecture',
        folder: 'Projects',
        tags: ['lifeos', 'fullstack', 'architecture'],
        color: '#10b981',
        isPinned: true,
        content: `### LifeOS Module Specs\n\n- **Backend**: Express.js REST API with JWT Auth, Mongoose schemas.\n- **Frontend**: Next.js App Router, Framer Motion, Vanilla CSS Modules.\n- **Security**: SHA-256 OTP hashing, bcrypt password encryption, rate limiting.`,
      },
      {
        userId,
        title: 'Interview Preparation Guide',
        folder: 'Career',
        tags: ['interview', 'career', 'java'],
        color: '#ec4899',
        isPinned: false,
        content: `### Technical & Behavioral Prep\n\n- Practice STAR method for behavioral responses.\n- Review System Design fundamentals (CAP Theorem, Load Balancing).\n- Solved 150+ LeetCode Medium problems.`,
      },
      {
        userId,
        title: 'Java DSA Core Patterns',
        folder: 'DSA',
        tags: ['java', 'dsa'],
        color: '#f97316',
        isPinned: false,
        content: `### Key Patterns\n\n- Two Pointers & Fast/Slow Pointers.\n- Merge Intervals Pattern.\n- Top K Elements (Heaps / PriorityQueue).\n- Dynamic Programming Memoization vs Tabulation.`,
      },
      {
        userId,
        title: 'Full Stack Web Developer Roadmap',
        folder: 'Projects',
        tags: ['roadmap', 'web'],
        color: '#8b5cf6',
        isPinned: false,
        content: `### Tech Stack Mastery\n\n- HTML5 / CSS3 / JavaScript ES6+\n- Node.js & Express.js REST APIs\n- MongoDB & Mongoose ORM\n- Next.js & React ecosystem`,
      },
      {
        userId,
        title: 'Daily Productivity Goals',
        folder: 'General',
        tags: ['productivity', 'goals'],
        color: '#0F8B8D',
        isPinned: false,
        content: `- Complete 3 high-priority tasks every morning.\n- Keep active streak going for DSA practice.\n- Maintain healthy sleep hygiene (11 PM bedtime).`,
      },
      {
        userId,
        title: 'Useful Git Commands Reference',
        folder: 'General',
        tags: ['git', 'devops'],
        color: '#3b82f6',
        isPinned: false,
        content: `\`\`\`bash\ngit checkout -b feature/auth\ngit add .\ngit commit -m "feat: implement OTP verification"\ngit push origin feature/auth\n\`\`\``,
      },
      {
        userId,
        title: 'Placement & System Design Prep',
        folder: 'Career',
        tags: ['placement', 'systemdesign'],
        color: '#10b981',
        isPinned: false,
        content: `- Database Indexing & B-Trees\n- Redis Caching & Invalidation Strategies\n- Message Queues (RabbitMQ / Kafka)`,
      },
      {
        userId,
        title: 'AI & LLM Integration Ideas',
        folder: 'Projects',
        tags: ['ai', 'ideas'],
        color: '#f97316',
        isPinned: false,
        content: `- Daily Brief AI summary of schedule & tasks\n- Weekly productivity review with mood analytics\n- Context-aware habit recommendations`,
      },
    ];

    await Note.insertMany(notesDocs);
    console.log(`  Created ${notesDocs.length} notes.`);

    // 5. Seed Journal Entries
    console.log('\n[5/8] Seeding 15 Demo Journal Entries...');
    const moods = ['great', 'good', 'great', 'good', 'okay', 'great', 'good', 'great'];

    const journalDocs = [];
    for (let i = 0; i < 15; i++) {
      const entryDate = new Date(now.getTime() - i * 86400000);
      const m = moods[i % moods.length];
      const mScore = m === 'great' ? 5 : m === 'good' ? 4 : 3;

      journalDocs.push({
        userId,
        title: i === 0 ? 'Reflections on LifeOS QA Build' : `Daily Journal — ${entryDate.toLocaleDateString()}`,
        content: `Today was a highly productive day. Focused on technical goals, DSA practice, and core application development. Maintained discipline and stayed consistent.`,
        date: entryDate,
        mood: m,
        moodScore: mScore,
        gratitude: ['Good health & focus', 'Continuous learning progress', 'Clean architecture in LifeOS'],
        wins: ['Completed DSA Array problems', 'Fixed authentication OTP flow', 'Hit daily water target'],
        challenges: ['Balancing project dev with interview revision'],
        reflections: 'Consistency is built step by step. Staying committed to daily habits yields compounding returns over time.',
        tomorrowGoals: ['Solve 3 DP problems', 'Refine frontend UI components'],
        tags: ['reflection', 'productivity', 'coding'],
        writingStreak: 15 - i,
      });
    }

    await Journal.insertMany(journalDocs);
    console.log(`  Created ${journalDocs.length} journal entries.`);

    // 6. Seed Calendar Events
    console.log('\n[6/8] Seeding 15 Demo Calendar Events...');
    const calendarEvents = [
      {
        userId,
        title: 'DSA Practice Session',
        description: 'Daily Array & Tree problems solve.',
        startTime: new Date(now.setHours(9, 0, 0, 0)),
        endTime: new Date(now.setHours(10, 30, 0, 0)),
        color: '#0F8B8D',
        location: 'Study Desk',
      },
      {
        userId,
        title: 'LifeOS Feature Development',
        description: 'Frontend component optimization and styling.',
        startTime: new Date(now.setHours(11, 0, 0, 0)),
        endTime: new Date(now.setHours(13, 0, 0, 0)),
        color: '#10b981',
        location: 'VS Code Workspace',
      },
      {
        userId,
        title: 'React & Next.js Study Session',
        description: 'Review SSR, SSG, and Turbopack features.',
        startTime: new Date(now.setHours(16, 0, 0, 0)),
        endTime: new Date(now.setHours(17, 30, 0, 0)),
        color: '#3b82f6',
      },
      {
        userId,
        title: 'Mock Technical Interview',
        description: 'Peer coding practice on System Design & Data Structures.',
        startTime: new Date(inTwoDays.setHours(19, 0, 0, 0)),
        endTime: new Date(inTwoDays.setHours(20, 0, 0, 0)),
        color: '#f97316',
        location: 'Google Meet',
      },
      {
        userId,
        title: 'LifeOS Project Sprint Review',
        description: 'Final review of auth, habits, and dashboard QA metrics.',
        startTime: new Date(inThreeDays.setHours(18, 0, 0, 0)),
        endTime: new Date(inThreeDays.setHours(19, 0, 0, 0)),
        color: '#8b5cf6',
      },
    ];

    await Event.insertMany(calendarEvents);
    console.log(`  Created ${calendarEvents.length} calendar events.`);

    // 7. Seed User Settings
    console.log('\n[7/8] Seeding User Settings...');
    await Settings.create({
      userId,
      theme: 'dark',
      accentColor: '#0F8B8D',
      language: 'en',
      timeZone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      notifications: {
        email: true,
        push: true,
        dailyDigest: true,
        habitReminders: true,
        taskReminders: true,
      },
      privacy: {
        publicProfile: false,
        shareAnalytics: true,
      },
    });
    console.log('  Created user settings.');

    // 8. Verification & Summary
    console.log('\n' + '═'.repeat(64));
    console.log('🎉 DEMO DATA SEEDED SUCCESSFULLY FOR USER: demo@lifeos.local');
    console.log('═'.repeat(64));
    console.log(`  Demo Account Credentials:`);
    console.log(`    Name     : Varsh Demo`);
    console.log(`    Email    : ${DEMO_EMAIL}`);
    console.log(`    Username : @varshdemo`);
    console.log(`    Password : ${DEMO_PASSWORD}`);
    console.log('─'.repeat(64));
    console.log(`  Records Summary:`);
    console.log(`    • Tasks Created        : ${taskDocs.length}`);
    console.log(`    • Habits Created       : ${createdHabits.length}`);
    console.log(`    • Historical Habit Logs: ${habitLogs.length} (365-day history)`);
    console.log(`    • Notes Created        : ${notesDocs.length}`);
    console.log(`    • Journal Entries      : ${journalDocs.length}`);
    console.log(`    • Calendar Events      : ${calendarEvents.length}`);
    console.log('═'.repeat(64) + '\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding demo data:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDemoData();
