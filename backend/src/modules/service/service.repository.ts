import prisma from '../../config/prisma';

export class ServiceRepository {
  async getServiceHierarchy() {
    return prisma.mainCategory.findMany({
      include: {
        categories: {
          include: {
            subCategories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getMainCategories() {
    return prisma.mainCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getCategoriesByMainCategoryId(mainCategoryId: string) {
    return prisma.category.findMany({
      where: { mainCategoryId },
      orderBy: { name: 'asc' },
    });
  }

  async getSubCategoriesByCategoryId(categoryId: string) {
    return prisma.subCategory.findMany({
      where: { categoryId },
      orderBy: { name: 'asc' },
    });
  }

  async createMainCategory(name: string) {
    return prisma.mainCategory.create({
      data: { name },
    });
  }

  async createCategory(name: string, mainCategoryId: string) {
    return prisma.category.create({
      data: { name, mainCategoryId },
    });
  }

  async createSubCategory(name: string, categoryId: string) {
    return prisma.subCategory.create({
      data: { name, categoryId },
    });
  }

  async updateMainCategory(id: string, name: string) {
    return prisma.mainCategory.update({
      where: { id },
      data: { name },
    });
  }

  async updateCategory(id: string, name: string) {
    return prisma.category.update({
      where: { id },
      data: { name },
    });
  }

  async updateSubCategory(id: string, name: string) {
    return prisma.subCategory.update({
      where: { id },
      data: { name },
    });
  }

  async deleteMainCategory(id: string) {
    await prisma.mainCategory.delete({
      where: { id },
    });
  }

  async deleteCategory(id: string) {
    await prisma.category.delete({
      where: { id },
    });
  }

  async deleteSubCategory(id: string) {
    await prisma.subCategory.delete({
      where: { id },
    });
  }

  async searchServices(query: string) {
    const mainCategories = await prisma.mainCategory.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
    });

    const categories = await prisma.category.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      include: { mainCategory: true },
    });

    const subCategories = await prisma.subCategory.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      include: { category: { include: { mainCategory: true } } },
    });

    return {
      mainCategories,
      categories,
      subCategories,
    };
  }

  async findMainCategoryById(id: string) {
    return prisma.mainCategory.findUnique({ where: { id } });
  }

  async findCategoryById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  }

  async findSubCategoryById(id: string) {
    return prisma.subCategory.findUnique({ where: { id } });
  }
}

export const serviceRepository = new ServiceRepository();
