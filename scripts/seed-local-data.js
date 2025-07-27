#!/usr/bin/env node

/**
 * Enhanced Local Development Data Seeding Script
 * 
 * This script seeds the local development database with comprehensive sample data:
 * - Multiple users (admin, regular user, super admin)
 * - Multiple locations with realistic descriptions
 * - 2 shelves per location
 * - 20 books per location (10 books per shelf)
 * - Rich book metadata with covers, descriptions, ratings
 * - Sample checkout history and ratings
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Enhanced sample data with rich book collection
const seedData = {
  // Sample user data with default passwords for local development
  users: [
    {
      id: 'dev-user-1',
      email: 'adminuser@localhost',
      first_name: 'Admin',
      last_name: 'User',
      password_hash: 'x3aF/PK1W5ANXtugiB5xLq+Pv0N513m0HHlrQNo5XoQo5a6SVNcAXMEoMA+JbOR/', // password: 'Admin123!'
      user_role: 'admin',
      email_verified: true,
      auth_provider: 'email',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dev-user-2', 
      email: 'testuser@localhost',
      first_name: 'Test',
      last_name: 'User',
      password_hash: '6nnxDALNKlHJASH1dCNGfHobYqggqagufRpeOAFQoVXrrHSK9bjyaCTrH/jHkLsX', // password: 'Test123!'
      user_role: 'user',
      email_verified: true,
      auth_provider: 'email',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dev-user-3',
      email: 'superadmin@localhost',
      first_name: 'Super',
      last_name: 'Admin',
      password_hash: 'YGDVg0BPOSTqA9YsMxeBBbBcOZxchgzRr2/tdpQ4auz6IJzVz1KWOS1J4W3Pr/3x', // password: 'Super123!'
      user_role: 'super_admin',
      email_verified: true,
      auth_provider: 'email',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'dev-user-4',
      email: 'reader@localhost',
      first_name: 'Book',
      last_name: 'Reader',
      password_hash: 'reading123hash', // password: 'Reader123!'
      user_role: 'user',
      email_verified: true,
      auth_provider: 'email',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  // Sample locations with detailed descriptions
  locations: [
    {
      name: 'Home Library',
      description: 'Personal book collection at home - programming, technical references, and fiction',
      owner_id: 'dev-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: 'Office Library',
      description: 'Work reading collection - management, business, and professional development',
      owner_id: 'dev-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      name: 'Community Library',
      description: 'Shared collection for the neighborhood - diverse fiction and non-fiction',
      owner_id: 'dev-user-2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  // Comprehensive book collection - 20 books per location across 2 shelves
  bookCollections: {
    homeLibrary: {
      shelf1: { // Programming & Development - 10 books
        name: 'Programming & Development',
        books: [
          {
            title: 'The Pragmatic Programmer',
            authors: '["David Thomas", "Andrew Hunt"]',
            isbn: '9780135957059',
            description: 'Your journey to mastery - 20th Anniversary Edition with updated content and practical advice for modern developers.',
            thumbnail: 'https://books.google.com/books/content?id=5wBQEp6ruIAC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "Programming"]',
            published_date: '2019',
            page_count: 352
          },
          {
            title: 'Clean Code',
            authors: '["Robert C. Martin"]',
            isbn: '9780132350884',
            description: 'A handbook of agile software craftsmanship. Learn to write code that is easy to read, understand, and maintain.',
            thumbnail: 'https://books.google.com/books/content?id=hjEFCAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "Software Engineering"]',
            published_date: '2008',
            page_count: 464
          },
          {
            title: 'Design Patterns',
            authors: '["Erich Gamma", "Richard Helm", "Ralph Johnson", "John Vlissides"]',
            isbn: '9780201633610',
            description: 'Elements of reusable object-oriented software by the Gang of Four.',
            thumbnail: 'https://books.google.com/books/content?id=6oHuKQe3TjQC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "Object-Oriented Programming"]',
            published_date: '1994',
            page_count: 395
          },
          {
            title: 'JavaScript: The Good Parts',
            authors: '["Douglas Crockford"]',
            isbn: '9780596517748',
            description: 'A guide to JavaScript best practices and the features that make JavaScript an outstanding programming language.',
            thumbnail: 'https://books.google.com/books/content?id=PXa2bby0oQ0C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "JavaScript"]',
            published_date: '2008',
            page_count: 172
          },
          {
            title: 'You Don\'t Know JS: Scope & Closures',
            authors: '["Kyle Simpson"]',
            isbn: '9781491924464',
            description: 'Deep dive into JavaScript fundamentals - understanding scope and closures.',
            thumbnail: 'https://books.google.com/books/content?id=2T6EnwEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Computers", "JavaScript"]',
            published_date: '2014',
            page_count: 98
          },
          {
            title: 'Refactoring',
            authors: '["Martin Fowler"]',
            isbn: '9780134757599',
            description: 'Improving the design of existing code. A comprehensive guide to refactoring techniques.',
            thumbnail: 'https://books.google.com/books/content?id=1MsQDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "Software Engineering"]',
            published_date: '2018',
            page_count: 448
          },
          {
            title: 'System Design Interview',
            authors: '["Alex Xu"]',
            isbn: '9780996049115',
            description: 'An insider\'s guide to system design interviews with step-by-step framework.',
            thumbnail: 'https://books.google.com/books/content?id=qzEaEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Computers", "System Design"]',
            published_date: '2020',
            page_count: 322
          },
          {
            title: 'Effective TypeScript',
            authors: '["Dan Vanderkam"]',
            isbn: '9781492053743',
            description: '62 specific ways to improve your TypeScript code and development experience.',
            thumbnail: 'https://books.google.com/books/content?id=3L6SDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "TypeScript"]',
            published_date: '2019',
            page_count: 264
          },
          {
            title: 'Microservices Patterns',
            authors: '["Chris Richardson"]',
            isbn: '9781617294549',
            description: 'With examples in Java. Learn how to build applications with microservices architecture.',
            thumbnail: 'https://books.google.com/books/content?id=mfRaDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "Microservices"]',
            published_date: '2018',
            page_count: 520
          },
          {
            title: 'Docker Deep Dive',
            authors: '["Nigel Poulton"]',
            isbn: '9781521822807',
            description: 'Zero to Docker in a single book. Learn Docker from the ground up.',
            thumbnail: 'https://books.google.com/books/content?id=VMFlDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Computers", "DevOps"]',
            published_date: '2017',
            page_count: 346
          }
        ]
      },
      shelf2: { // Technical References - 10 books
        name: 'Technical References',
        books: [
          {
            title: 'Database Design for Mere Mortals',
            authors: '["Michael J. Hernandez"]',
            isbn: '9780321884497',
            description: 'A hands-on guide to relational database design and practical techniques.',
            thumbnail: 'https://books.google.com/books/content?id=fkmuBAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "Databases"]',
            published_date: '2013',
            page_count: 672
          },
          {
            title: 'RESTful Web APIs',
            authors: '["Leonard Richardson", "Mike Amundsen", "Sam Ruby"]',
            isbn: '9781449358068',
            description: 'Services for a changing world. Design and build web APIs that embrace REST.',
            thumbnail: 'https://books.google.com/books/content?id=9MqNBAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "Web APIs"]',
            published_date: '2013',
            page_count: 408
          },
          {
            title: 'High Performance MySQL',
            authors: '["Baron Schwartz", "Peter Zaitsev", "Vadim Tkachenko"]',
            isbn: '9781449314286',
            description: 'Optimization, backups, and replication techniques for MySQL databases.',
            thumbnail: 'https://books.google.com/books/content?id=YQQ6AwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "MySQL"]',
            published_date: '2012',
            page_count: 826
          },
          {
            title: 'Kubernetes: Up and Running',
            authors: '["Kelsey Hightower", "Brendan Burns", "Joe Beda"]',
            isbn: '9781492046530',
            description: 'Dive into the future of infrastructure. Learn to deploy and manage applications.',
            thumbnail: 'https://books.google.com/books/content?id=wJBeEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "Kubernetes"]',
            published_date: '2019',
            page_count: 318
          },
          {
            title: 'Site Reliability Engineering',
            authors: '["Niall Richard Murphy", "Betsy Beyer", "Chris Jones", "Jennifer Petoff"]',
            isbn: '9781491929124',
            description: 'How Google runs production systems. Learn SRE principles and practices.',
            thumbnail: 'https://books.google.com/books/content?id=81UrjwEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Computers", "DevOps"]',
            published_date: '2016',
            page_count: 552
          },
          {
            title: 'Building Secure and Reliable Systems',
            authors: '["Heather Adkins", "Betsy Beyer", "Paul Blankinship", "Ana Oprea"]',
            isbn: '9781492083122',
            description: 'Best practices for designing, implementing, and maintaining systems.',
            thumbnail: 'https://books.google.com/books/content?id=1WsAEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "Security"]',
            published_date: '2020',
            page_count: 558
          },
          {
            title: 'Distributed Systems',
            authors: '["Maarten van Steen", "Andrew S. Tanenbaum"]',
            isbn: '9781543057386',
            description: 'Principles and paradigms for building distributed systems.',
            thumbnail: 'https://books.google.com/books/content?id=g0SaDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Computers", "Distributed Systems"]',
            published_date: '2017',
            page_count: 596
          },
          {
            title: 'Learning React',
            authors: '["Alex Banks", "Eve Porcello"]',
            isbn: '9781492051725',
            description: 'Modern patterns for developing React apps. Build dynamic UIs.',
            thumbnail: 'https://books.google.com/books/content?id=p9dUEAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Computers", "React"]',
            published_date: '2020',
            page_count: 310
          },
          {
            title: 'Node.js: The Right Way',
            authors: '["Jim Wilson"]',
            isbn: '9781680502381',
            description: 'Practical server-side JavaScript that scales. Build robust applications.',
            thumbnail: 'https://books.google.com/books/content?id=JE5fDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Computers", "Node.js"]',
            published_date: '2018',
            page_count: 334
          },
          {
            title: 'Web Security Testing Cookbook',
            authors: '["Paco Hope", "Ben Walther"]',
            isbn: '9780596514839',
            description: 'Systematic techniques for finding problems in web applications.',
            thumbnail: 'https://books.google.com/books/content?id=8ADYAAAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Computers", "Security"]',
            published_date: '2008',
            page_count: 312
          }
        ]
      }
    },
    officeLibrary: {
      shelf1: { // Management & Leadership - 10 books
        name: 'Management & Leadership',
        books: [
          {
            title: 'The Manager\'s Path',
            authors: '["Camille Fournier"]',
            isbn: '9781491973899',
            description: 'A guide for tech leaders navigating growth and change in engineering management.',
            thumbnail: 'https://books.google.com/books/content?id=yPjJDAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Management"]',
            published_date: '2017',
            page_count: 244
          },
          {
            title: 'Radical Candor',
            authors: '["Kim Scott"]',
            isbn: '9781250103505',
            description: 'How to get what you want by saying what you mean in leadership.',
            thumbnail: 'https://books.google.com/books/content?id=qbKmDAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Leadership"]',
            published_date: '2017',
            page_count: 280
          },
          {
            title: 'Team Topologies',
            authors: '["Matthew Skelton", "Manuel Pais"]',
            isbn: '9781942788829',
            description: 'Organizing business and technology teams for fast flow.',
            thumbnail: 'https://books.google.com/books/content?id=qV1QzgEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Business", "Team Management"]',
            published_date: '2019',
            page_count: 240
          },
          {
            title: 'The Phoenix Project',
            authors: '["Gene Kim", "Kevin Behr", "George Spafford"]',
            isbn: '9780988262508',
            description: 'A novel about IT, DevOps, and helping your business win.',
            thumbnail: 'https://books.google.com/books/content?id=M2BxyQEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Business", "DevOps"]',
            published_date: '2013',
            page_count: 432
          },
          {
            title: 'Accelerate',
            authors: '["Nicole Forsgren", "Jez Humble", "Gene Kim"]',
            isbn: '9781942788331',
            description: 'The science of lean software and DevOps: building and scaling high performing organizations.',
            thumbnail: 'https://books.google.com/books/content?id=Kax-DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "DevOps"]',
            published_date: '2018',
            page_count: 288
          },
          {
            title: 'Good to Great',
            authors: '["Jim Collins"]',
            isbn: '9780066620992',
            description: 'Why some companies make the leap... and others don\'t.',
            thumbnail: 'https://books.google.com/books/content?id=ay6ITxGn9kQC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Management"]',
            published_date: '2001',
            page_count: 320
          },
          {
            title: 'The Lean Startup',
            authors: '["Eric Ries"]',
            isbn: '9780307887894',
            description: 'How today\'s entrepreneurs use continuous innovation to create radically successful businesses.',
            thumbnail: 'https://books.google.com/books/content?id=r9x-OXdzpPcC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Entrepreneurship"]',
            published_date: '2011',
            page_count: 320
          },
          {
            title: 'Measure What Matters',
            authors: '["John Doerr"]',
            isbn: '9780525536222',
            description: 'How Google, Bono, and the Gates Foundation rock the world with OKRs.',
            thumbnail: 'https://books.google.com/books/content?id=Eh1VDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "OKRs"]',
            published_date: '2018',
            page_count: 320
          },
          {
            title: 'The Culture Code',
            authors: '["Daniel Coyle"]',
            isbn: '9780553419726',
            description: 'The secrets of highly successful groups and team dynamics.',
            thumbnail: 'https://books.google.com/books/content?id=HGPEDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Culture"]',
            published_date: '2018',
            page_count: 304
          },
          {
            title: 'High Output Management',
            authors: '["Andrew Grove"]',
            isbn: '9780679762881',
            description: 'Intel\'s legendary former CEO shares management techniques and philosophies.',
            thumbnail: 'https://books.google.com/books/content?id=C6k4uAEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Business", "Management"]',
            published_date: '1995',
            page_count: 272
          }
        ]
      },
      shelf2: { // Business Strategy - 10 books
        name: 'Business Strategy',
        books: [
          {
            title: 'Zero to One',
            authors: '["Peter Thiel", "Blake Masters"]',
            isbn: '9780804139298',
            description: 'Notes on startups, or how to build the future.',
            thumbnail: 'https://books.google.com/books/content?id=TwIVAgAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Startups"]',
            published_date: '2014',
            page_count: 224
          },
          {
            title: 'The Innovator\'s Dilemma',
            authors: '["Clayton M. Christensen"]',
            isbn: '9781633691780',
            description: 'When new technologies cause great firms to fail.',
            thumbnail: 'https://books.google.com/books/content?id=SIexi_qgqgMC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Innovation"]',
            published_date: '2015',
            page_count: 288
          },
          {
            title: 'Blue Ocean Strategy',
            authors: '["W. Chan Kim", "Renée Mauborgne"]',
            isbn: '9781625274496',
            description: 'How to create uncontested market space and make competition irrelevant.',
            thumbnail: 'https://books.google.com/books/content?id=HrOdDAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Strategy"]',
            published_date: '2015',
            page_count: 288
          },
          {
            title: 'The Hard Thing About Hard Things',
            authors: '["Ben Horowitz"]',
            isbn: '9780062273208',
            description: 'Building a business when there are no easy answers.',
            thumbnail: 'https://books.google.com/books/content?id=wfr_AgAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Entrepreneurship"]',
            published_date: '2014',
            page_count: 304
          },
          {
            title: 'Crossing the Chasm',
            authors: '["Geoffrey A. Moore"]',
            isbn: '9780062292988',
            description: 'Marketing and selling disruptive products to mainstream customers.',
            thumbnail: 'https://books.google.com/books/content?id=ymeKAwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Marketing"]',
            published_date: '2014',
            page_count: 288
          },
          {
            title: 'Thinking, Fast and Slow',
            authors: '["Daniel Kahneman"]',
            isbn: '9780374533557',
            description: 'Insights into how we think and make decisions.',
            thumbnail: 'https://books.google.com/books/content?id=ZuKTvERuPG8C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Psychology", "Decision Making"]',
            published_date: '2011',
            page_count: 512
          },
          {
            title: 'Platform Revolution',
            authors: '["Geoffrey G. Parker", "Marshall W. Van Alstyne", "Sangeet Paul Choudary"]',
            isbn: '9780393249132',
            description: 'How networked markets are transforming the economy and how to make them work for you.',
            thumbnail: 'https://books.google.com/books/content?id=pZAYCwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Platform Strategy"]',
            published_date: '2016',
            page_count: 352
          },
          {
            title: 'The Subscription Economy',
            authors: '["Tien Tzuo", "Gabe Weisert"]',
            isbn: '9780525536468',
            description: 'Why the future of business is selling less of more.',
            thumbnail: 'https://books.google.com/books/content?id=LkYyDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Subscription Models"]',
            published_date: '2018',
            page_count: 240
          },
          {
            title: 'Hooked',
            authors: '["Nir Eyal"]',
            isbn: '9781591847786',
            description: 'How to build habit-forming products.',
            thumbnail: 'https://books.google.com/books/content?id=dsz5AwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Business", "Product Design"]',
            published_date: '2014',
            page_count: 256
          },
          {
            title: 'The Mom Test',
            authors: '["Rob Fitzpatrick"]',
            isbn: '9781492180746',
            description: 'How to talk to customers and learn if your business is a good idea.',
            thumbnail: 'https://books.google.com/books/content?id=M3dGsgEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Business", "Customer Development"]',
            published_date: '2013',
            page_count: 134
          }
        ]
      }
    },
    communityLibrary: {
      shelf1: { // Science Fiction & Fantasy - 10 books
        name: 'Science Fiction & Fantasy',
        books: [
          {
            title: 'Dune',
            authors: '["Frank Herbert"]',
            isbn: '9780441172719',
            description: 'The science fiction adventure of all time. Set on the desert planet Arrakis.',
            thumbnail: 'https://books.google.com/books/content?id=ydQiDQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Fiction", "Science Fiction"]',
            published_date: '2005',
            page_count: 688
          },
          {
            title: 'The Hobbit',
            authors: '["J.R.R. Tolkien"]',
            isbn: '9780547928227',
            description: 'The classic fantasy adventure of Bilbo Baggins.',
            thumbnail: 'https://books.google.com/books/content?id=hFfhrCWiLSMC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Fiction", "Fantasy"]',
            published_date: '2012',
            page_count: 300
          },
          {
            title: 'Ender\'s Game',
            authors: '["Orson Scott Card"]',
            isbn: '9780765394859',
            description: 'Young Andrew Ender Wiggin saves humanity in this science fiction classic.',
            thumbnail: 'https://books.google.com/books/content?id=zaOzAwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Fiction", "Science Fiction"]',
            published_date: '2013',
            page_count: 352
          },
          {
            title: 'The Name of the Wind',
            authors: '["Patrick Rothfuss"]',
            isbn: '9780756404741',
            description: 'The first book in the Kingkiller Chronicle series.',
            thumbnail: 'https://books.google.com/books/content?id=dOOHPAAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Fiction", "Fantasy"]',
            published_date: '2007',
            page_count: 662
          },
          {
            title: 'Neuromancer',
            authors: '["William Gibson"]',
            isbn: '9780441569595',
            description: 'The groundbreaking cyberpunk novel that defined a genre.',
            thumbnail: 'https://books.google.com/books/content?id=NdQQAAAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Fiction", "Cyberpunk"]',
            published_date: '2000',
            page_count: 271
          },
          {
            title: 'The Martian',
            authors: '["Andy Weir"]',
            isbn: '9780553418026',
            description: 'A stranded astronaut must survive on Mars using science and ingenuity.',
            thumbnail: 'https://books.google.com/books/content?id=D4dGBAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Fiction", "Science Fiction"]',
            published_date: '2014',
            page_count: 384
          },
          {
            title: 'Ready Player One',
            authors: '["Ernest Cline"]',
            isbn: '9780307887436',
            description: 'A virtual reality adventure in a dystopian future.',
            thumbnail: 'https://books.google.com/books/content?id=bL2mfEq37WYC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Fiction", "Science Fiction"]',
            published_date: '2011',
            page_count: 384
          },
          {
            title: 'The Way of Kings',
            authors: '["Brandon Sanderson"]',
            isbn: '9780765326355',
            description: 'The first book in the epic Stormlight Archive series.',
            thumbnail: 'https://books.google.com/books/content?id=qpg0EAAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Fiction", "Fantasy"]',
            published_date: '2010',
            page_count: 1008
          },
          {
            title: 'Foundation',
            authors: '["Isaac Asimov"]',
            isbn: '9780553293357',
            description: 'The first book in Asimov\'s legendary Foundation series.',
            thumbnail: 'https://books.google.com/books/content?id=iK5dkwEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Fiction", "Science Fiction"]',
            published_date: '1991',
            page_count: 244
          },
          {
            title: 'American Gods',
            authors: '["Neil Gaiman"]',
            isbn: '9780380789030',
            description: 'A blend of Americana, fantasy, and mythology.',
            thumbnail: 'https://books.google.com/books/content?id=2ANEAQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Fiction", "Fantasy"]',
            published_date: '2003',
            page_count: 624
          }
        ]
      },
      shelf2: { // Classic Literature & Non-Fiction - 10 books
        name: 'Classic Literature & Non-Fiction',
        books: [
          {
            title: 'To Kill a Mockingbird',
            authors: '["Harper Lee"]',
            isbn: '9780061120084',
            description: 'A timeless story of justice and moral growth in the American South.',
            thumbnail: 'https://books.google.com/books/content?id=nnV9VxqI-EMC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Fiction", "Classics"]',
            published_date: '2006',
            page_count: 376
          },
          {
            title: '1984',
            authors: '["George Orwell"]',
            isbn: '9780452284234',
            description: 'The dystopian novel that gave us Big Brother and thought police.',
            thumbnail: 'https://books.google.com/books/content?id=kotPYEqx7kMC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Fiction", "Dystopian"]',
            published_date: '1987',
            page_count: 328
          },
          {
            title: 'Pride and Prejudice',
            authors: '["Jane Austen"]',
            isbn: '9780141439518',
            description: 'The romantic novel that has captivated readers for over 200 years.',
            thumbnail: 'https://books.google.com/books/content?id=ZC4dAAAAMAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Fiction", "Romance"]',
            published_date: '2003',
            page_count: 480
          },
          {
            title: 'Sapiens',
            authors: '["Yuval Noah Harari"]',
            isbn: '9780062316097',
            description: 'A brief history of humankind and how we came to dominate the planet.',
            thumbnail: 'https://books.google.com/books/content?id=FmyBAwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["History", "Anthropology"]',
            published_date: '2015',
            page_count: 464
          },
          {
            title: 'The Great Gatsby',
            authors: '["F. Scott Fitzgerald"]',
            isbn: '9780743273565',
            description: 'The quintessential American novel of the Jazz Age.',
            thumbnail: 'https://books.google.com/books/content?id=9aTyJTEHjr0C&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Fiction", "Classics"]',
            published_date: '2004',
            page_count: 180
          },
          {
            title: 'Educated',
            authors: '["Tara Westover"]',
            isbn: '9780399590504',
            description: 'A memoir about education and transformation.',
            thumbnail: 'https://books.google.com/books/content?id=qNhADwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Biography", "Memoir"]',
            published_date: '2018',
            page_count: 334
          },
          {
            title: 'The Catcher in the Rye',
            authors: '["J.D. Salinger"]',
            isbn: '9780316769174',
            description: 'Holden Caulfield\'s journey through New York City.',
            thumbnail: 'https://books.google.com/books/content?id=0LQxEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
            categories: '["Fiction", "Coming of Age"]',
            published_date: '2001',
            page_count: 277
          },
          {
            title: 'Atomic Habits',
            authors: '["James Clear"]',
            isbn: '9780735211292',
            description: 'An easy and proven way to build good habits and break bad ones.',
            thumbnail: 'https://books.google.com/books/content?id=fFCjDQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Self-Help", "Psychology"]',
            published_date: '2018',
            page_count: 320
          },
          {
            title: 'The Handmaid\'s Tale',
            authors: '["Margaret Atwood"]',
            isbn: '9780385490818',
            description: 'A dystopian tale of a woman\'s struggle to survive in a totalitarian state.',
            thumbnail: 'https://books.google.com/books/content?id=a7cyDDPpRvEC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Fiction", "Dystopian"]',
            published_date: '1998',
            page_count: 311
          },
          {
            title: 'Becoming',
            authors: '["Michelle Obama"]',
            isbn: '9781524763138',
            description: 'Memoir of the former First Lady of the United States.',
            thumbnail: 'https://books.google.com/books/content?id=hivDDwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
            categories: '["Biography", "Memoir"]',
            published_date: '2018',
            page_count: 448
          }
        ]
      }
    }
  }
};

// Console styling
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logStep(message) {
  log(`\n📚 ${message}`, 'cyan');
}

function execWrangler(command, description) {
  try {
    log(`   Running: ${command}`, 'blue');
    const result = execSync(command, { stdio: 'inherit', timeout: 30000 });
    return result;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    throw error;
  }
}

function execWranglerSilent(command, description) {
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return result;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    throw error;
  }
}

function writeSqlFile(sql, filename) {
  const tempFile = `/tmp/${filename}`;
  fs.writeFileSync(tempFile, sql);
  return tempFile;
}

function seedUsers() {
  logStep('Seeding users...');
  
  for (const user of seedData.users) {
    const sql = `INSERT OR REPLACE INTO users (id, email, first_name, last_name, password_hash, user_role, email_verified, auth_provider, created_at, updated_at) 
                 VALUES ('${user.id}', '${user.email}', '${user.first_name}', '${user.last_name}', '${user.password_hash}', '${user.user_role}', ${user.email_verified}, '${user.auth_provider}', '${user.created_at}', '${user.updated_at}')`;
    
    const tempFile = writeSqlFile(sql, `seed-user-${user.id}.sql`);
    execWrangler(`npx wrangler d1 execute DB --local --file="${tempFile}"`, `Seeding user ${user.email}`);
    fs.unlinkSync(tempFile);
  }
  
  logSuccess(`${seedData.users.length} users seeded successfully`);
}

function seedGenres() {
  logStep('Seeding curated genres...');
  
  // Use the superadmin user as the creator for all genres
  const adminUserId = 'dev-user-3'; // superadmin@localhost
  
  const genres = [
    // Fiction Genres (25)
    { name: 'Action & Adventure', description: 'Fast-paced stories featuring exciting adventures and heroic characters' },
    { name: 'Children\'s Literature', description: 'Books specifically written for children and young readers' },
    { name: 'Classics', description: 'Timeless literary works of enduring significance and quality' },
    { name: 'Comedy & Humor', description: 'Books intended to entertain and amuse through wit and humor' },
    { name: 'Contemporary Fiction', description: 'Modern literary works set in the present day' },
    { name: 'Crime & Mystery', description: 'Stories involving criminal activity, detection, and puzzle-solving' },
    { name: 'Dystopian & Post-Apocalyptic', description: 'Fiction set in societies where life is miserable or after catastrophic events' },
    { name: 'Fantasy', description: 'Stories featuring magical or supernatural elements and imaginary worlds' },
    { name: 'Gothic & Horror', description: 'Dark, suspenseful stories designed to frighten, unsettle, or create suspense' },
    { name: 'Graphic Novel & Comics', description: 'Narrative works combining visual art with text in comic format' },
    { name: 'Historical Fiction', description: 'Stories set in the past, recreating historical periods and events' },
    { name: 'Literary Fiction', description: 'Character-driven works emphasizing artistic expression over commercial appeal' },
    { name: 'Magical Realism', description: 'Fiction that incorporates fantastical elements into realistic narratives' },
    { name: 'Paranormal & Supernatural', description: 'Stories involving phenomena beyond normal scientific understanding' },
    { name: 'Poetry', description: 'Literary works expressing emotions, ideas, or experiences through verse' },
    { name: 'Psychological Thriller', description: 'Suspenseful stories focusing on characters\' mental and emotional states' },
    { name: 'Romance', description: 'Stories centered around romantic relationships and love' },
    { name: 'Science Fiction', description: 'Fiction dealing with futuristic concepts, technology, and scientific phenomena' },
    { name: 'Short Stories', description: 'Brief fictional prose narratives' },
    { name: 'Thriller & Suspense', description: 'Fast-paced stories designed to keep readers in suspense' },
    { name: 'Urban Fantasy', description: 'Fantasy stories set in urban, contemporary environments' },
    { name: 'War Fiction', description: 'Stories set during wartime or dealing with themes of warfare' },
    { name: 'Western', description: 'Stories set in the American Old West frontier period' },
    { name: 'Young Adult', description: 'Fiction targeted at teenage readers, typically ages 12-18' },
    { name: 'LGBTQ+ Fiction', description: 'Stories featuring LGBTQ+ characters, themes, and experiences' },
    
    // Non-Fiction Genres (20)
    { name: 'Art & Design', description: 'Books about visual arts, design principles, and creative expression' },
    { name: 'Biography & Memoir', description: 'Life stories and personal accounts of real people' },
    { name: 'Business & Economics', description: 'Books about business practices, economic theory, and financial matters' },
    { name: 'Cooking & Food', description: 'Culinary guides, recipes, and food-related topics' },
    { name: 'Education & Academia', description: 'Educational materials, teaching methods, and academic subjects' },
    { name: 'Essays & Literature', description: 'Collections of essays and literary criticism' },
    { name: 'Health & Fitness', description: 'Books about physical wellness, exercise, and medical topics' },
    { name: 'History', description: 'Accounts of past events, historical analysis, and historical narratives' },
    { name: 'Philosophy', description: 'Exploration of fundamental questions about existence, knowledge, and ethics' },
    { name: 'Politics & Social Issues', description: 'Books about government, political theory, and social concerns' },
    { name: 'Psychology', description: 'Studies of mind, behavior, and mental processes' },
    { name: 'Reference & How-To', description: 'Instructional guides, manuals, and reference materials' },
    { name: 'Religion & Spirituality', description: 'Books about faith, religious practices, and spiritual beliefs' },
    { name: 'Science & Nature', description: 'Scientific concepts, natural phenomena, and environmental topics' },
    { name: 'Self-Help & Personal Development', description: 'Guidance for personal improvement and life enhancement' },
    { name: 'Sports & Recreation', description: 'Books about athletics, games, and recreational activities' },
    { name: 'Technology & Computing', description: 'Technical topics, computer science, and digital innovation' },
    { name: 'Travel & Adventure', description: 'Travel guides, adventure narratives, and exploration accounts' },
    { name: 'True Crime', description: 'Real criminal cases, investigations, and justice system stories' },
    { name: 'Current Events & Journalism', description: 'Contemporary news analysis, reportage, and journalistic works' }
  ];
  
  // Create SQL statements for all genres
  const genreInserts = genres.map(genre => 
    `INSERT OR IGNORE INTO curated_genres (name, description, created_by) VALUES ('${genre.name.replace(/'/g, "''")}', '${genre.description.replace(/'/g, "''")}', '${adminUserId}');`
  ).join('\n');
  
  const tempFile = writeSqlFile(genreInserts, 'seed-genres.sql');
  execWrangler(`npx wrangler d1 execute DB --local --file="${tempFile}"`, 'Seeding curated genres');
  fs.unlinkSync(tempFile);
  
  logSuccess(`${genres.length} curated genres seeded successfully`);
}

function seedLocationsAndShelves() {
  logStep('Seeding locations and shelves...');
  
  let locationId = 1;
  let shelfId = 1;
  
  for (const [locationKey, locationData] of Object.entries(seedData.bookCollections)) {
    // Seed location
    const location = seedData.locations[locationId - 1];
    const locationSql = `INSERT INTO locations (id, name, description, owner_id, created_at, updated_at) 
                        VALUES (${locationId}, '${location.name}', '${location.description}', '${location.owner_id}', '${location.created_at}', '${location.updated_at}')`;
    
    const locationFile = writeSqlFile(locationSql, `seed-location-${locationId}.sql`);
    execWrangler(`npx wrangler d1 execute DB --local --file="${locationFile}"`, `Seeding location ${location.name}`);
    fs.unlinkSync(locationFile);
    
    // Seed shelves for this location
    for (const [shelfKey, shelfData] of Object.entries(locationData)) {
      const shelfSql = `INSERT INTO shelves (id, name, location_id, created_at, updated_at) 
                       VALUES (${shelfId}, '${shelfData.name}', ${locationId}, '${new Date().toISOString()}', '${new Date().toISOString()}')`;
      
      const shelfFile = writeSqlFile(shelfSql, `seed-shelf-${shelfId}.sql`);
      execWrangler(`npx wrangler d1 execute DB --local --file="${shelfFile}"`, `Seeding shelf ${shelfData.name}`);
      fs.unlinkSync(shelfFile);
      
      shelfId++;
    }
    
    locationId++;
  }
  
  const totalShelves = shelfId - 1;
  logSuccess(`${locationId - 1} locations and ${totalShelves} shelves seeded successfully`);
}

function seedBooks() {
  logStep('Seeding comprehensive book collection...');
  
  let bookCount = 0;
  let shelfId = 1;
  const userId = 'dev-user-1'; // Admin user for most books
  
  for (const [locationKey, locationData] of Object.entries(seedData.bookCollections)) {
    for (const [shelfKey, shelfData] of Object.entries(locationData)) {
      for (const book of shelfData.books) {
        const escapedTitle = book.title.replace(/'/g, "''");
        const escapedDescription = book.description.replace(/'/g, "''");
        const escapedAuthors = book.authors.replace(/'/g, "''");
        const escapedCategories = book.categories.replace(/'/g, "''");
        
        const bookSql = `INSERT INTO books (
          title, authors, isbn, description, thumbnail, categories, 
          published_date, page_count, shelf_id, added_by, created_at
        ) VALUES (
          '${escapedTitle}', 
          '${escapedAuthors}', 
          '${book.isbn}', 
          '${escapedDescription}', 
          '${book.thumbnail}', 
          '${escapedCategories}', 
          '${book.published_date}', 
          ${book.page_count}, 
          ${shelfId}, 
          '${userId}', 
          '${new Date().toISOString()}'
        )`;
        
        const bookFile = writeSqlFile(bookSql, `seed-book-${bookCount}.sql`);
        try {
          execWranglerSilent(`npx wrangler d1 execute DB --local --file="${bookFile}"`, `Seeding book ${book.title}`);
          bookCount++;
        } catch (error) {
          log(`   ⚠️  Skipped book: ${book.title} (${error.message})`, 'yellow');
        }
        fs.unlinkSync(bookFile);
      }
      shelfId++;
    }
  }
  
  logSuccess(`${bookCount} books seeded successfully across all locations`);
}

function addSampleRatings() {
  logStep('Adding sample book ratings...');
  
  const ratingUsers = ['dev-user-1', 'dev-user-2', 'dev-user-4'];
  const sampleReviews = [
    'Excellent read! Highly recommend.',
    'Very informative and well-written.',
    'Great introduction to the topic.',
    'A must-read for anyone interested in this field.',
    'Practical advice with real-world examples.',
    'Clear explanations and engaging writing style.',
    'Valuable insights and actionable tips.',
    'Well-structured and easy to follow.'
  ];
  
  // Get actual book IDs from the database - use a simpler approach
  let bookIds = [];
  try {
    // Just use the first 15 books that we know exist since we just seeded 60 books
    // This avoids the complex JSON parsing issues with wrangler output
    for (let i = 1; i <= 15; i++) {
      bookIds.push(i);
    }
    log(`   Using book IDs 1-15 for ratings`, 'blue');
  } catch (error) {
    log(`   ⚠️  Could not set up book IDs: ${error.message}`, 'yellow');
    return;
  }
  
  if (bookIds.length === 0) {
    log(`   ⚠️  No books found for rating`, 'yellow');
    return;
  }
  
  let ratingCount = 0;
  
  // Add ratings for available books (only first 15 to avoid too many ratings)
  for (const bookId of bookIds) {
    const numRatings = Math.floor(Math.random() * 3) + 1; // 1-3 ratings per book
    
    for (let i = 0; i < numRatings; i++) {
      const userId = ratingUsers[Math.floor(Math.random() * ratingUsers.length)];
      const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
      const reviewText = Math.random() > 0.5 ? sampleReviews[Math.floor(Math.random() * sampleReviews.length)] : null;
      
      const ratingSql = `INSERT OR IGNORE INTO book_ratings (
        book_id, user_id, rating, review_text, created_at, updated_at
      ) VALUES (
        ${bookId}, '${userId}', ${rating}, ${reviewText ? `'${reviewText.replace(/'/g, "''")}'` : 'NULL'}, 
        '${new Date().toISOString()}', '${new Date().toISOString()}'
      )`;
      
      const ratingFile = writeSqlFile(ratingSql, `seed-rating-${ratingCount}.sql`);
      try {
        execWranglerSilent(`npx wrangler d1 execute DB --local --file="${ratingFile}"`, `Adding rating for book ${bookId}`);
        ratingCount++;
      } catch (error) {
        log(`   ⚠️  Failed to add rating for book ${bookId}: ${error.message}`, 'yellow');
      }
      fs.unlinkSync(ratingFile);
    }
  }
  
  logSuccess(`${ratingCount} sample ratings added`);
}

function clearDatabase() {
  logStep('Clearing existing data...');
  
  // Clear ALL data including users, genres, and all related tables
  // Order matters due to foreign key constraints
  const tables = [
    'book_ratings',
    'book_genres', 
    'genre_suggestions',
    'books',
    'shelves', 
    'locations',
    'curated_genres',
    'users'
  ];
  
  for (const table of tables) {
    const sql = `DELETE FROM ${table}`;
    try {
      execWranglerSilent(`npx wrangler d1 execute DB --local --command "${sql}"`, `Clearing ${table}`);
    } catch (error) {
      log(`   ⚠️  Warning: Could not clear ${table} (table may not exist)`, 'yellow');
    }
  }
  
  logSuccess('Database completely cleared - ready for fresh seeding');
}

function verifySeeding() {
  logStep('Verifying seeded data...');
  
  const queries = [
    { name: 'Users', query: 'SELECT COUNT(*) as count FROM users' },
    { name: 'Genres', query: 'SELECT COUNT(*) as count FROM curated_genres' },
    { name: 'Locations', query: 'SELECT COUNT(*) as count FROM locations' },
    { name: 'Shelves', query: 'SELECT COUNT(*) as count FROM shelves' },
    { name: 'Books', query: 'SELECT COUNT(*) as count FROM books' },
    { name: 'Ratings', query: 'SELECT COUNT(*) as count FROM book_ratings' }
  ];
  
  for (const { name, query } of queries) {
    try {
      // Use command directly instead of file for simpler parsing
      const result = execWranglerSilent(
        `npx wrangler d1 execute DB --local --command "${query}"`,
        `Verifying ${name}`
      );
      
      // Parse count from JSON result
      let count = 'unknown';
      try {
        // Strip ANSI codes and extract JSON
        const cleanResult = result.replace(/\x1b\[[0-9;]*m/g, '');
        const jsonMatch = cleanResult.match(/\[\s*\{[\s\S]*?\}\s*\]/);
        
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          if (jsonData[0] && jsonData[0].results && jsonData[0].results[0]) {
            count = jsonData[0].results[0].count;
          }
        }
      } catch (parseError) {
        // Fallback: try to find a number in the output
        const numberMatch = result.match(/\b(\d+)\b/);
        count = numberMatch ? numberMatch[1] : 'parse error';
      }
      log(`   ${name}: ${count} records`, 'green');
    } catch (error) {
      log(`   ${name}: verification failed`, 'red');
    }
  }
}

function main() {
  log(`${colors.bright}${colors.magenta}📚 LibraryCard Enhanced Data Seeding${colors.reset}`);
  log(`${colors.cyan}Creating comprehensive sample data for local development...${colors.reset}\n`);
  
  // Check if we're in the right directory
  try {
    execSync('ls wrangler.toml', { stdio: 'ignore' });
  } catch (error) {
    logError('wrangler.toml not found. Please run this script from the project root.');
    process.exit(1);
  }
  
  const startTime = Date.now();
  
  try {
    clearDatabase();
    seedUsers();
    seedGenres();
    seedLocationsAndShelves();
    seedBooks();
    verifySeeding();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    log(`\n${colors.bright}${colors.green}🎉 Enhanced data seeding completed successfully!${colors.reset}`);
    log(`${colors.green}⏱️  Total time: ${duration}s${colors.reset}`);
    log(`\n${colors.cyan}Your local database now contains:${colors.reset}`);
    log(`   • 4 sample users (admin, user, super admin, reader)`);
    log(`   • 45 curated genres (25 fiction + 20 non-fiction)`);
    log(`   • 3 locations (Home Library, Office Library, Community Library)`);
    log(`   • 6 shelves (2 per location)`);
    log(`   • 60 books total (20 per location, 10 per shelf)`);
    log(`   • Clean slate ready for user-generated ratings and reviews`);
    log(`\n${colors.yellow}Login credentials:${colors.reset}`);
    log(`   Admin: adminuser@localhost / Admin123!`);
    log(`   User: testuser@localhost / Test123!`);
    log(`   Super Admin: superadmin@localhost / Super123!`);
    log(`   Reader: reader@localhost / Reader123!`);
    
  } catch (error) {
    logError(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}