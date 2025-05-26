import { TestResource, ResourceFixtures, TestFixture } from '@/types';

export const validResources: TestFixture<TestResource[]> = {
  name: 'validResources',
  description: 'Collection of valid resource data for positive testing',
  tags: ['positive', 'valid', 'resources'],
  data: [
    {
      name: 'cerulean',
      year: 2000,
      color: '#98B2D1',
      pantone_value: '15-4020',
      description: 'A beautiful cerulean blue color'
    },
    {
      name: 'fuchsia rose',
      year: 2001,
      color: '#C74375',
      pantone_value: '17-2031',
      description: 'A vibrant fuchsia rose color'
    },
    {
      name: 'true red',
      year: 2002,
      color: '#BF1932',
      pantone_value: '19-1664',
      description: 'A classic true red color'
    },
    {
      name: 'aqua sky',
      year: 2003,
      color: '#7BC4C4',
      pantone_value: '14-4811',
      description: 'A refreshing aqua sky color'
    },
    {
      name: 'tigerlily',
      year: 2004,
      color: '#E2583E',
      pantone_value: '17-1456',
      description: 'A warm tigerlily orange color'
    },
    {
      name: 'blue turquoise',
      year: 2005,
      color: '#53B0AE',
      pantone_value: '15-5217',
      description: 'A cool blue turquoise color'
    }
  ]
};

export const invalidResources: TestFixture<TestResource[]> = {
  name: 'invalidResources',
  description: 'Collection of invalid resource data for negative testing',
  tags: ['negative', 'invalid', 'resources'],
  data: [
    {
      name: '',
      year: 1800,
      color: 'invalid-color',
      pantone_value: '',
      description: ''
    },
    {
      name: 'Test Resource',
      year: 2050,
      color: '#GGGGGG',
      pantone_value: 'invalid-pantone',
      description: 'Invalid resource'
    },
    {
      name: 'A'.repeat(101),
      year: -1,
      color: '#12345',
      pantone_value: '',
      description: 'B'.repeat(1001)
    }
  ]
};

export const popularResources: TestFixture<TestResource[]> = {
  name: 'popularResources',
  description: 'Collection of popular resource data for trending scenarios',
  tags: ['popular', 'trending', 'resources'],
  data: [
    {
      name: 'classic blue',
      year: 2020,
      color: '#0F4C75',
      pantone_value: '19-4052',
      description: 'Pantone Color of the Year 2020'
    },
    {
      name: 'illuminating',
      year: 2021,
      color: '#F5DF4D',
      pantone_value: '13-0647',
      description: 'Pantone Color of the Year 2021 (co-winner)'
    },
    {
      name: 'ultimate gray',
      year: 2021,
      color: '#939597',
      pantone_value: '17-5104',
      description: 'Pantone Color of the Year 2021 (co-winner)'
    },
    {
      name: 'very peri',
      year: 2022,
      color: '#6667AB',
      pantone_value: '17-3938',
      description: 'Pantone Color of the Year 2022'
    },
    {
      name: 'viva magenta',
      year: 2023,
      color: '#BB2649',
      pantone_value: '18-1750',
      description: 'Pantone Color of the Year 2023'
    }
  ]
};

export const vintageResources: TestFixture<TestResource[]> = {
  name: 'vintageResources',
  description: 'Collection of vintage resource data for historical scenarios',
  tags: ['vintage', 'historical', 'resources'],
  data: [
    {
      name: 'emerald',
      year: 2013,
      color: '#009B77',
      pantone_value: '17-5641',
      description: 'Pantone Color of the Year 2013'
    },
    {
      name: 'radiant orchid',
      year: 2014,
      color: '#B565A7',
      pantone_value: '18-3224',
      description: 'Pantone Color of the Year 2014'
    },
    {
      name: 'marsala',
      year: 2015,
      color: '#955251',
      pantone_value: '18-1438',
      description: 'Pantone Color of the Year 2015'
    },
    {
      name: 'rose quartz',
      year: 2016,
      color: '#F7CAC9',
      pantone_value: '13-1520',
      description: 'Pantone Color of the Year 2016 (co-winner)'
    },
    {
      name: 'serenity',
      year: 2016,
      color: '#92A8D1',
      pantone_value: '15-3919',
      description: 'Pantone Color of the Year 2016 (co-winner)'
    }
  ]
};

export const edgeCaseResources: TestFixture<TestResource[]> = {
  name: 'edgeCaseResources',
  description: 'Collection of edge case resource data for boundary testing',
  tags: ['edge-case', 'boundary', 'resources'],
  data: [
    {
      name: 'A',
      year: 1900,
      color: '#000000',
      pantone_value: '19-0303',
      description: 'Minimal resource'
    },
    {
      name: 'Very Long Resource Name For Testing Maximum Length Boundaries',
      year: 2024,
      color: '#FFFFFF',
      pantone_value: '11-0601',
      description: 'This is a very long description for testing maximum length boundaries and ensuring the system can handle extended text content properly without breaking or causing issues.'
    },
    {
      name: 'Special-Chars & Symbols!',
      year: 2023,
      color: '#FF5733',
      pantone_value: '17-1463',
      description: 'Resource with special characters: @#$%^&*()_+-=[]{}|;:,.<>?'
    },
    {
      name: 'Unicode Tëst Rësöurcë',
      year: 2022,
      color: '#33FF57',
      pantone_value: '14-6340',
      description: 'Rësöurcë with ünicödë chäräctërs: àáâãäåæçèéêë'
    }
  ]
};

export const resourceFixtures: ResourceFixtures = {
  validResources,
  invalidResources,
  popularResources
};

// Helper functions for working with resource fixtures
export function getResourceByName(name: string): TestResource | undefined {
  const allResources = [
    ...validResources.data,
    ...popularResources.data,
    ...vintageResources.data
  ];

  return allResources.find(resource =>
    resource.name?.toLowerCase() === name.toLowerCase()
  );
}

export function getResourcesByYear(year: number): TestResource[] {
  const allResources = [
    ...validResources.data,
    ...popularResources.data,
    ...vintageResources.data
  ];

  return allResources.filter(resource => resource.year === year);
}

export function getResourcesByColorTheme(theme: 'warm' | 'cool' | 'neutral'): TestResource[] {
  const allResources = [
    ...validResources.data,
    ...popularResources.data,
    ...vintageResources.data
  ];

  const warmColors = ['#E2583E', '#BB2649', '#955251', '#F5DF4D'];
  const coolColors = ['#98B2D1', '#7BC4C4', '#53B0AE', '#0F4C75', '#92A8D1'];
  const neutralColors = ['#939597', '#BF1932'];

  let targetColors: string[];
  switch (theme) {
    case 'warm':
      targetColors = warmColors;
      break;
    case 'cool':
      targetColors = coolColors;
      break;
    case 'neutral':
      targetColors = neutralColors;
      break;
    default:
      return [];
  }

  return allResources.filter(resource =>
    targetColors.includes(resource.color || '')
  );
}

export function getRandomValidResource(): TestResource {
  const resources = validResources.data;
  return resources[Math.floor(Math.random() * resources.length)];
}

export function getRandomInvalidResource(): TestResource {
  const resources = invalidResources.data;
  return resources[Math.floor(Math.random() * resources.length)];
}

export function getResourceForScenario(scenario: 'popular' | 'vintage' | 'modern' | 'edge_case'): TestResource {
  switch (scenario) {
    case 'popular':
      return popularResources.data[0];
    case 'vintage':
      return vintageResources.data[0];
    case 'modern':
      return validResources.data[validResources.data.length - 1];
    case 'edge_case':
      return edgeCaseResources.data[0];
    default:
      return validResources.data[0];
  }
}

export function getPantoneColorsOfTheYear(): TestResource[] {
  return [
    ...popularResources.data,
    ...vintageResources.data
  ].filter(resource =>
    resource.description?.includes('Pantone Color of the Year')
  );
}
