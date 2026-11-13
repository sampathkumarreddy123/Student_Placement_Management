import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Company from '../models/Company.js';
import PlacementDrive from '../models/PlacementDrive.js';
import Application from '../models/Application.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('[Seeder] Cleaning existing database...');
    await User.deleteMany();
    await StudentProfile.deleteMany();
    await Company.deleteMany();
    await PlacementDrive.deleteMany();
    await Application.deleteMany();

    console.log('[Seeder] Creating Users...');
    // Create Officer from environment variables
    const officer = await User.create({
      name: process.env.DEFAULT_OFFICER_NAME || 'Dr. Anita Sharma (Placement Head)',
      email: (process.env.DEFAULT_OFFICER_EMAIL || 'officer@college.edu').toLowerCase().trim(),
      password: process.env.DEFAULT_OFFICER_PASSWORD || 'password123',
      role: 'officer',
    });

    // Create Students
    const student1 = await User.create({
      name: 'Rahul Verma',
      email: 'student@college.edu',
      password: 'password123',
      role: 'student',
    });

    const student2 = await User.create({
      name: 'Priya Sundaram',
      email: 'priya@college.edu',
      password: 'password123',
      role: 'student',
    });

    console.log('[Seeder] Creating Student Profiles...');
    const profile1 = await StudentProfile.create({
      user: student1._id,
      rollNumber: 'CS2026-042',
      department: 'Computer Science',
      batch: 2026,
      cgpa: 8.75,
      backlogs: 0,
      tenthPercentage: 92,
      twelfthPercentage: 89,
      phone: '+91 98765 43210',
      resumeUrl: 'https://example.com/resumes/rahul-verma.pdf',
      skills: ['React', 'Node.js', 'MongoDB', 'Python', 'Data Structures', 'Git'],
      placementStatus: 'Not Placed',
    });

    const profile2 = await StudentProfile.create({
      user: student2._id,
      rollNumber: 'EC2026-019',
      department: 'Electronics & Communication',
      batch: 2026,
      cgpa: 7.2,
      backlogs: 1,
      tenthPercentage: 84,
      twelfthPercentage: 81,
      phone: '+91 98123 45678',
      resumeUrl: 'https://example.com/resumes/priya-sundaram.pdf',
      skills: ['C++', 'Embedded Systems', 'IoT', 'Python'],
      placementStatus: 'Not Placed',
    });

    console.log('[Seeder] Creating Companies...');
    const google = await Company.create({
      name: 'Google India',
      website: 'https://careers.google.com',
      industry: 'Software & Cloud Computing',
      description: 'Global technology leader specializing in search, cloud systems, and AI services.',
      location: 'Bengaluru / Hyderabad',
      contactEmail: 'campus-hiring@google.com',
      contactPerson: 'Karan Mehra',
    });

    const microsoft = await Company.create({
      name: 'Microsoft IDC',
      website: 'https://careers.microsoft.com',
      industry: 'Software & Cloud Services',
      description: 'Empowering every person and organization on the planet to achieve more.',
      location: 'Hyderabad / Noida',
      contactEmail: 'university-india@microsoft.com',
      contactPerson: 'Sneha Patel',
    });

    const infosys = await Company.create({
      name: 'Infosys Limited',
      website: 'https://www.infosys.com/careers',
      industry: 'IT Services & Consulting',
      description: 'Global leader in next-generation digital services and consulting.',
      location: 'Bengaluru / Pune / Chennai',
      contactEmail: 'talent.acquisition@infosys.com',
      contactPerson: 'Vikram Joshi',
    });

    console.log('[Seeder] Creating Placement Drives...');
    const now = new Date();
    const futureDate1 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days later
    const deadline1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

    const drive1 = await PlacementDrive.create({
      company: google._id,
      title: 'Google Software Engineering Campus Drive 2026',
      jobRole: 'Associate Software Engineer',
      description: 'Join our Cloud & Core Infrastructure engineering teams to design massive scale systems.',
      packageLPA: 24.5,
      location: 'Bengaluru',
      eligibilityCriteria: {
        minCgpa: 8.0,
        maxBacklogs: 0,
        allowedDepartments: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
        minTenthPercentage: 75,
        minTwelfthPercentage: 75,
        batch: 2026,
      },
      driveDate: futureDate1,
      registrationDeadline: deadline1,
      rounds: [
        { roundNumber: 1, roundName: 'Online Coding Challenge', description: '2 LeetCode Medium/Hard algorithmic questions', date: new Date(deadline1.getTime() + 2 * 24 * 60 * 60 * 1000) },
        { roundNumber: 2, roundName: 'Technical Interview 1', description: 'Data Structures & Algorithms in depth', date: new Date(deadline1.getTime() + 5 * 24 * 60 * 60 * 1000) },
        { roundNumber: 3, roundName: 'Technical Interview 2 & Googliness', description: 'System design, fundamentals and culture fit', date: futureDate1 },
      ],
      status: 'Upcoming',
      createdBy: officer._id,
    });

    const drive2 = await PlacementDrive.create({
      company: microsoft._id,
      title: 'Microsoft Graduate Hire Program 2026',
      jobRole: 'Software Engineer',
      description: 'Build services on Azure, Microsoft 365 and developer tools powering millions of developers.',
      packageLPA: 19.0,
      location: 'Hyderabad',
      eligibilityCriteria: {
        minCgpa: 7.5,
        maxBacklogs: 0,
        allowedDepartments: ['Computer Science', 'Information Technology', 'Electronics & Communication'],
        minTenthPercentage: 70,
        minTwelfthPercentage: 70,
        batch: 2026,
      },
      driveDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      rounds: [
        { roundNumber: 1, roundName: 'Codility Assessment', description: 'Algorithmic problem solving' },
        { roundNumber: 2, roundName: 'Virtual Technical Round', description: 'Core CS concepts and coding' },
        { roundNumber: 3, roundName: 'Managerial & Techno-HR', description: 'Project discussion and behavioral round' },
      ],
      status: 'Upcoming',
      createdBy: officer._id,
    });

    const drive3 = await PlacementDrive.create({
      company: infosys._id,
      title: 'Infosys Specialist Programmer (DSE/SP)',
      jobRole: 'Digital Specialist Engineer',
      description: 'Specialist programming roles working on AI, full stack and cloud native applications.',
      packageLPA: 9.5,
      location: 'Pan India',
      eligibilityCriteria: {
        minCgpa: 6.5,
        maxBacklogs: 1,
        allowedDepartments: ['Computer Science', 'Information Technology', 'Electronics & Communication', 'Electrical Engineering'],
        minTenthPercentage: 60,
        minTwelfthPercentage: 60,
        batch: 2026,
      },
      driveDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      rounds: [
        { roundNumber: 1, roundName: 'InfyTQ Certification Round', description: 'Programming and analytical test' },
        { roundNumber: 2, roundName: 'Technical & HR Discussion', description: 'Comprehensive interview' },
      ],
      status: 'Upcoming',
      createdBy: officer._id,
    });

    console.log('[Seeder] Creating Sample Application...');
    await Application.create({
      student: student1._id,
      studentProfile: profile1._id,
      drive: drive1._id,
      status: 'Shortlisted',
      currentRound: 2,
      officerNotes: 'Strong profile, cleared round 1 coding assessment with 100% score.',
    });

    console.log('[Seeder] Successfully seeded data!');
    console.log('----------------------------------------------------');
    console.log('Sample Accounts Created:');
    console.log('Officer: email: officer@college.edu | password: password123');
    console.log('Student: email: student@college.edu | password: password123');
    console.log('Student 2: email: priya@college.edu | password: password123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]', error);
    process.exit(1);
  }
};

seedDatabase();

