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
    status: "Completed",
    overview:
      "Built a bare-metal Type-1 hypervisor using Proxmox VE hosting a virtual Windows Server domain controller and Active Directory environment, equipped with a live frontend query tool to inspect system accounts and active services in real time.",
    goal:
      "Practice hands-on enterprise virtualization, Active Directory administration, and operating system audits through secure, live integrations.",
    technologies: ["Proxmox VE", "Windows Server 2022", "Active Directory", "PowerShell Cmdlets", "System Auditing"],
    whatIDid: [
      "Provisioned a bare-metal Proxmox Virtual Environment (PVE)",
      "Set up a virtualized Windows Server domain controller and configured Active Directory Domain Services (AD DS)",
      "Built an OS-level query endpoint using PowerShell child-processes to fetch active domain users, running processes, and network setups",
      "Designed a real-time frontend Directory Explorer allowing visitors to execute active audits on the hosting server",
      "Configured Group Policy Objects (GPOs) and organizational units (OUs) for system hardening"
    ],
    result: "Completed — AD DS environment fully deployed and integrated with live query tools on this portfolio.",
    takeaways: [
      "Deep familiarity with Windows Server roles, AD DS administration, and domain architecture",
      "Executing safe, read-only administrative PowerShell scripts via API endpoints",
      "Diagnosing network virtualization, DHCP, DNS, and secure directory services"
    ],
  },
  {
    id: "cloud-lab",
    title: "Azure Cloud Deployment & CI/CD",
    status: "Completed",
    overview:
      "Engineered an automated CI/CD pipeline deploying this React portfolio to Azure using GitHub Actions and Azure Static Web Apps, integrated with a live continuous deployment Guestbook that commits signatures to GitHub via the REST API.",
    goal:
      "Build hands-on CI/CD automation skills by enabling visitors to trigger, track, and verify a real deployment pipeline run in real time.",
    technologies: ["Microsoft Azure", "Azure Static Web Apps", "GitHub Actions", "GitHub REST API", "CI/CD Pipeline"],
    whatIDid: [
      "Provisioned Azure Static Web App resources via the Azure CLI",
      "Configured a GitHub Actions workflow for automated continuous integration and deployment",
      "Implemented a secure write-back API utilizing GitHub's Contents API to append visitor signatures directly to repository files",
      "Built a live pipeline tracker showing the workflow run's progress (Queued, Building, Deploying) and active logs directly from GitHub API"
    ],
    result: "Completed — Pipeline fully integrated with a secure guestbook commit deployment visualizer.",
    takeaways: [
      "Designing automated CI/CD workflows and secure Git write-back integrations",
      "Managing deployment secrets and securing API write scopes (XSS prevention and rate limiting)",
      "Implementing cost-effective (zero-cost) enterprise cloud deployment structures"
    ],
  },
  {
    id: "nas-storage",
    title: "Personal NAS Cloud Storage",
    status: "Completed",
    overview:
      "Configured a Network Attached Storage (NAS) file storage server integrated with the portfolio site, letting users upload, browse, download, and manage files under a 1GB quota, while providing secure, unlimited persistent storage for the administrator.",
    goal:
      "Demonstrate hands-on storage area network (SAN) and NAS concepts, API-based file management, role-based authorization, and storage quota enforcement.",
    technologies: ["Node.js", "Azure Functions", "File APIs", "Storage Quota System", "Vanilla CSS"],
    whatIDid: [
      "Implemented a file upload/download API endpoint in Azure Functions",
      "Designed a storage quota calculation module enforcing 1GB total limits for guests",
      "Created an Owner Mode allowing password-authenticated administrative access to a separate personal directory",
      "Built a responsive NAS explorer frontend with upload/download/delete controls",
      "Added real-time capacity monitoring and validation warnings"
    ],
    result: "Completed — NAS file explorer live on the site with 1GB quota limit and Owner Mode.",
    takeaways: [
      "Handling multipart file uploads in serverless endpoints",
      "Implementing storage volume calculation and quota enforcement",
      "Building secure file explorer frontends with authorization headers",
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
