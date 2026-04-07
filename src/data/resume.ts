export const person = {
  name: "Gavin Zola",
  title: "IT Graduate | System Administration | Cloud & Infrastructure Focus",
  summary:
    "Analytical and driven Information Technology undergraduate specializing in System and Network Administration, with hands-on experience in device management, network configuration, and user support. Demonstrated leadership as a top-performing associate and acting shift lead at Best Buy, translating complex technical concepts into clear customer guidance. Skilled in Windows Server, Linux, and enterprise device environments. Seeking an entry-level IT role focused on system administration, network operations, or infrastructure support.",
  email: "gavinzola@email.com",
  github: "https://github.com/gavinzola",
  linkedin: "https://linkedin.com/in/gavinzola",
};

export const highlights = [
  "IT Internship at South Shore Charter Public School — device onboarding, server setup, and IT support",
  "Tech retail experience at Best Buy and Staples — translating complex tech into clear guidance",
  "Systems & cloud focus — Windows Server, Linux, networking fundamentals",
  "Hands-on automation exposure through coursework in intermediate scripting and system administration",
];

export const projects = [
  {
    id: "ad-homelab",
    title: "Active Directory Home Lab",
    status: "In Progress",
    overview:
      "Building a virtual Windows Server environment with domain services, user management, and Group Policy to simulate a real enterprise IT environment.",
    goal:
      "Practice hands-on Active Directory administration outside of a production setting to build job-ready skills in domain management and enterprise configuration.",
    technologies: ["Windows Server 2022", "Hyper-V / VirtualBox", "Active Directory", "Group Policy Management Console"],
    whatIDid: [
      "Setting up a virtualized Windows Server domain controller",
      "Configuring Active Directory Domain Services (AD DS)",
      "Creating organizational units (OUs) and user accounts",
      "Applying Group Policy Objects (GPOs) for security and configuration settings",
    ],
    result: "In progress — environment standing up with AD DS and basic OU structure in place.",
    takeaways: [
      "Deep familiarity with Windows Server roles and features",
      "Practical understanding of enterprise domain architecture",
      "Experience diagnosing virtualization and DNS issues",
    ],
  },
  {
    id: "cloud-lab",
    title: "Cloud Infrastructure Lab",
    status: "Planned",
    overview:
      "A planned project to deploy and manage cloud-based virtual machines and networking infrastructure to gain hands-on cloud administration skills.",
    goal:
      "Build foundational cloud skills in VM deployment, security configuration, and remote administration.",
    technologies: ["Microsoft Azure (planned)", "Azure Virtual Machines", "Network Security Groups", "Remote Desktop / SSH"],
    whatIDid: [
      "VM deployment and configuration planning",
      "Firewall and security configuration design",
      "Remote access setup strategy",
    ],
    result: "Planned — infrastructure design underway.",
    takeaways: [
      "Cloud networking concepts (VNets, subnets, NSGs)",
      "VM provisioning and management in a cloud environment",
      "Secure remote access configurations",
    ],
  },
  {
    id: "automation-scripts",
    title: "PowerShell Automation Scripts",
    status: "Planned",
    overview:
      "A planned collection of PowerShell scripts to automate common system administration tasks like bulk user creation, backup automation, and system monitoring.",
    goal:
      "Reduce repetitive manual IT tasks and develop scripting skills applicable in a real enterprise environment.",
    technologies: ["PowerShell", "Windows Server", "Active Directory PowerShell Module", "Task Scheduler"],
    whatIDid: [
      "Bulk user creation script design",
      "Backup automation planning",
      "System monitoring script architecture",
    ],
    result: "Planned — script design and requirements gathering in progress.",
    takeaways: [
      "PowerShell syntax and scripting best practices",
      "Automating Active Directory user management",
      "Scheduling and logging automated tasks",
    ],
  },
];

export const experience = [
  {
    id: "bestbuy",
    title: "Tech Sales Associate / Acting Shift Lead",
    company: "Best Buy",
    location: "Boston, MA",
    dates: "April 2025 – Present",
    bullets: [
      "Advise customers on computers, mobile devices, and tech peripherals, translating complex specifications into clear purchasing decisions",
      "Serve as acting shift lead, coordinating team operations and ensuring high customer satisfaction in a high-volume retail environment",
      "Apply hands-on technical knowledge to assist customers with product setup, troubleshooting, and technology guidance",
    ],
  },
  {
    id: "staples",
    title: "Sales Consultant — Tech Services",
    company: "Staples",
    location: "Boston, MA",
    dates: "June 2022 – February 2024",
    bullets: [
      "Delivered tech services including computer scans, data backups, data transfers, antivirus installations, driver installs, OS updates, and virus removals",
      "Guided customers through technology purchasing decisions for printers, computers, and peripherals, achieving consistent sales targets",
      "Assisted across multiple store roles including cashier, furniture sales, online order processing, and customer account creation while maintaining high customer satisfaction",
    ],
  },
  {
    id: "sscps",
    title: "IT Department Intern",
    company: "South Shore Charter Public School",
    location: "Boston, MA",
    dates: "June 2023 – August 2023",
    bullets: [
      "Conducted device onboarding for Chromebooks, Macs, and iPads — including OS installations and enterprise software configuration",
      "Repaired laptops, maintained projectors, and assisted with the setup of the school's new networking server and speaker system",
      "Supported faculty and students with technical issues, gaining practical experience in IT management and internal business operations",
    ],
  },
];

export const skills = {
  Systems: ["Windows Server", "Linux / Unix", "Windows 10/11"],
  Networking: ["DNS", "DHCP", "Network configuration", "Wi-Fi troubleshooting"],
  Tools: ["Active Directory", "Hyper-V / VirtualBox", "Support ticketing systems"],
  Cloud: ["Microsoft Azure (learning)", "Cloud VM fundamentals"],
  Scripting: ["PowerShell", "Bash basics"],
  "IT Support": [
    "Device onboarding (Chromebook, Mac, iPad, PC)",
    "Hardware & software troubleshooting",
    "Over-the-phone technical support",
    "Data backup & transfer",
    "OS installations",
  ],
  "Other Skills": [
    "Sales and customer communication",
    "Technical writing for non-technical audiences",
    "Generative AI tools (coding, agent models)",
    "File management and organizational systems",
  ],
};

export const education = [
  {
    institution: "UMass Boston",
    degree: "B.S. Information Technology — System Administration Focus",
    minor: "Minor: Management",
    dates: "September 2021 – Planned Spring 2026",
    notes: [
      "Attended lectures from industry leaders focusing on AI and its application in business",
    ],
  },
  {
    institution: "Darmstadt University of Applied Sciences",
    degree: "Study Abroad Program",
    dates: "March 2024 – August 2024",
    notes: [
      "Developed adaptability and communication skills in a new cultural and academic environment",
      "Met with the head of the Hessen House of Digital Transformation — gained insight into technology integration strategies for businesses",
    ],
  },
];

export const courses = [
  "IT Problem Solving",
  "Introduction to Networks",
  "Introduction to Linux/Unix",
  "Windows System Administration",
  "Network Security Administration",
  "System Administration",
  "Relational Databases",
  "Intermediate Scripting",
  "Social Issues and Ethics in Computing",
];

export const additionalExperience = [
  "Experience in over-the-phone technical support",
  "Familiar with support ticketing systems",
  "Regularly follow emerging technologies, industry trends, and news",
  "Deep experience utilizing various types of generative AI models, including coding and agent models",
  "Significant organizational experience, including file management",
];

export const personalProjects = [
  {
    title: "PC Refurbishment for Community Donation",
    description:
      "Refurbished decommissioned PCs with fresh OS installations and secure network configurations for donation to a community library.",
  },
  {
    title: "Home Network Support",
    description:
      "Provided local residents with home Wi-Fi setup and troubleshooting support, enhancing network performance and coverage.",
  },
];
