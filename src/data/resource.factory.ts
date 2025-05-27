import { faker } from '@faker-js/faker';
import { TestResource, ResourceFactory } from '@/types';

export class ResourceDataFactory implements ResourceFactory {
  createResource(overrides?: Partial<TestResource>): TestResource {
    const resource: TestResource = {
      name: faker.commerce.productName(),
      year: faker.date.between({ from: '2000-01-01', to: '2024-12-31' }).getFullYear(),
      color: faker.color.rgb({ format: 'hex' }),
      pantone_value: this.generatePantoneValue(),
      description: faker.commerce.productDescription(),
      ...overrides
    };

    return resource;
  }

  createResources(count: number, overrides?: Partial<TestResource>): TestResource[] {
    return Array.from({ length: count }, () => this.createResource(overrides));
  }

  createValidResource(): TestResource {
    return this.createResource({
      name: faker.commerce.productName(),
      year: faker.date.recent().getFullYear(),
      color: faker.color.rgb({ format: 'hex' }),
      pantone_value: this.generatePantoneValue()
    });
  }

  // Create resource with invalid data for negative testing
  createInvalidResource(): TestResource {
    return this.createResource({
      name: '',
      year: 1800,
      color: 'invalid-color',
      pantone_value: ''
    });
  }

  createResourceWithColorTheme(theme: 'warm' | 'cool' | 'neutral' | 'bright'): TestResource {
    const colorsByTheme = {
      warm: ['#FF6B35', '#F7931E', '#FFD23F', '#EE4B2B', '#FF7F7F'],
      cool: ['#4A90E2', '#50C878', '#6495ED', '#40E0D0', '#9370DB'],
      neutral: ['#808080', '#A0A0A0', '#D3D3D3', '#F5F5F5', '#696969'],
      bright: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']
    };

    const colors = colorsByTheme[theme];
    const selectedColor = faker.helpers.arrayElement(colors);

    return this.createResource({
      color: selectedColor,
      pantone_value: this.generatePantoneValue()
    });
  }

  createResourceForYear(year: number): TestResource {
    return this.createResource({
      year,
      name: `${faker.commerce.productName()} ${year}`
    });
  }

  createVintageResource(): TestResource {
    const vintageYear = faker.date.between({ from: '2000-01-01', to: '2010-12-31' }).getFullYear();

    return this.createResource({
      year: vintageYear,
      name: `Vintage ${faker.commerce.productName()}`,
      color: faker.helpers.arrayElement(['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F4A460'])
    });
  }

  createModernResource(): TestResource {
    const modernYear = faker.date.between({ from: '2020-01-01', to: '2024-12-31' }).getFullYear();

    return this.createResource({
      year: modernYear,
      name: `Modern ${faker.commerce.productName()}`,
      color: faker.helpers.arrayElement(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'])
    });
  }

  createRealisticResource(): TestResource {
    const productCategories = [
      'Paint', 'Fabric', 'Ceramic', 'Glass', 'Metal', 'Plastic', 'Wood', 'Stone'
    ];

    const category = faker.helpers.arrayElement(productCategories);
    const adjective = faker.helpers.arrayElement(['Premium', 'Classic', 'Modern', 'Vintage', 'Luxury', 'Standard']);

    return this.createResource({
      name: `${adjective} ${category} ${faker.commerce.productMaterial()}`,
      year: faker.date.between({ from: '2015-01-01', to: '2024-12-31' }).getFullYear(),
      color: faker.color.rgb({ format: 'hex' }),
      pantone_value: this.generatePantoneValue()
    });
  }

  createBulkResources(count: number): TestResource[] {
    return Array.from({ length: count }, () => this.createRealisticResource());
  }

  // Create resources with edge case data for boundary testing
  createEdgeCaseResource(type: 'long_name' | 'special_chars' | 'unicode' | 'minimal'): TestResource {
    switch (type) {
      case 'long_name':
        return this.createResource({
          name: 'A'.repeat(100),
          description: 'B'.repeat(500)
        });

      case 'special_chars':
        return this.createResource({
          name: "Premium Paint & Coating Solution #1",
          description: "High-quality paint with special characters: @#$%^&*()"
        });

      case 'unicode':
        return this.createResource({
          name: "Peinture Française Spéciale",
          description: "Couleur spéciale avec caractères unicode: éàèùâêîôû"
        });

      case 'minimal':
        return this.createResource({
          name: "A",
          description: "B"
        });

      default:
        return this.createValidResource();
    }
  }

  createResourceCollection(totalCount: number, pageSize: number = 6): TestResource[][] {
    const allResources = this.createResources(totalCount);
    const pages: TestResource[][] = [];

    for (let i = 0; i < allResources.length; i += pageSize) {
      pages.push(allResources.slice(i, i + pageSize));
    }

    return pages;
  }

  createResourceWithPantone(pantoneValue: string): TestResource {
    const pantoneToHex: Record<string, string> = {
      '15-4020': '#98B2D1',
      '17-2031': '#C74375',
      '18-3838': '#5F4B8B',
      '19-4052': '#34568B',
      '15-0343': '#88B04B'
    };

    const hexColor = pantoneToHex[pantoneValue] || faker.color.rgb({ format: 'hex' });

    return this.createResource({
      pantone_value: pantoneValue,
      color: hexColor,
      name: `Pantone ${pantoneValue} ${faker.commerce.productName()}`
    });
  }

  private generatePantoneValue(): string {
    const prefix = faker.helpers.arrayElement(['15', '16', '17', '18', '19']);
    const suffix = faker.string.numeric(4);
    return `${prefix}-${suffix}`;
  }

  createResourceForScenario(scenario: string): TestResource {
    const scenarios: Record<string, Partial<TestResource>> = {
      'popular_color': {
        name: 'Popular Blue',
        color: '#0000FF',
        pantone_value: '19-4052',
        year: 2023
      },
      'vintage_item': {
        name: 'Vintage Brown',
        color: '#8B4513',
        pantone_value: '18-1142',
        year: 2005
      },
      'modern_trend': {
        name: 'Modern Coral',
        color: '#FF7F50',
        pantone_value: '16-1546',
        year: 2024
      }
    };

    const scenarioData = scenarios[scenario] || {};
    return this.createResource(scenarioData);
  }

  // Validate resource data for testing purposes
  validateResourceData(resource: TestResource): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!resource.name || resource.name.trim().length === 0) {
      errors.push('Resource name is required');
    }

    if (!resource.year || resource.year < 1900 || resource.year > new Date().getFullYear() + 10) {
      errors.push('Resource year must be between 1900 and 10 years in the future');
    }

    if (!resource.color || !/^#[0-9A-F]{6}$/i.test(resource.color)) {
      errors.push('Resource color must be a valid hex color');
    }

    if (!resource.pantone_value || resource.pantone_value.trim().length === 0) {
      errors.push('Resource Pantone value is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
