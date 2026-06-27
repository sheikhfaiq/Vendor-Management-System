import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../../../api/serviceApi';
import { Card } from '../../../components/Card/Card';
import { Loader } from '../../../components/Loader/Loader';
import { Search, ChevronDown, ChevronRight, FolderDot, Tag } from 'lucide-react';
import { Input } from '../../../components/Input/Input';

const ServiceCatalogComponent: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMainCategories, setExpandedMainCategories] = useState<Record<string, boolean>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const { data: hierarchy, isLoading } = useQuery({
    queryKey: ['serviceHierarchy'],
    queryFn: serviceApi.getServiceHierarchy,
  });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const toggleMainCategory = useCallback((id: string) => {
    setExpandedMainCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Filter hierarchy based on search query
  const filteredHierarchy = useMemo(() => {
    if (!hierarchy) return [];
    if (!searchQuery.trim()) return hierarchy;

    const query = searchQuery.toLowerCase();

    return hierarchy
      .map((mainCat) => {
        const filteredCats = (mainCat.categories || [])
          .map((cat) => {
            const filteredSubCats = (cat.subCategories || []).filter((sub) =>
              sub.name.toLowerCase().includes(query)
            );

            const catMatches = cat.name.toLowerCase().includes(query);
            const hasMatchingSubs = filteredSubCats.length > 0;

            if (catMatches || hasMatchingSubs) {
              return {
                ...cat,
                subCategories: catMatches ? cat.subCategories : filteredSubCats,
              };
            }
            return null;
          })
          .filter(Boolean) as any[];

        const mainMatches = mainCat.name.toLowerCase().includes(query);
        const hasMatchingCats = filteredCats.length > 0;

        if (mainMatches || hasMatchingCats) {
          return {
            ...mainCat,
            categories: mainMatches ? mainCat.categories : filteredCats,
          };
        }
        return null;
      })
      .filter(Boolean) as any[];
  }, [hierarchy, searchQuery]);

  const searchIcon = useMemo(() => <Search className="h-4 w-4" />, []);

  if (isLoading) return <Loader />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Service Catalog & Scope Tree
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Browse our directory of trades, categories, and scopes of work
          </p>
        </div>

        <div className="w-full md:w-80">
          <Input
            type="text"
            placeholder="Search catalog trades..."
            value={searchQuery}
            onChange={handleSearchChange}
            icon={searchIcon}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredHierarchy.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-sm text-slate-400">No categories found matching your query.</p>
          </Card>
        ) : (
          filteredHierarchy.map((mainCat) => {
            const isMainExpanded = !!expandedMainCategories[mainCat.id] || !!searchQuery;
            return (
              <Card key={mainCat.id} className="p-0 border border-slate-100 overflow-hidden">
                {/* Main Category Header */}
                <div
                  onClick={() => toggleMainCategory(mainCat.id)}
                  className="bg-slate-50/50 hover:bg-slate-50 px-6 py-4 flex items-center justify-between cursor-pointer border-b border-slate-100/50 select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <FolderDot className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-semibold text-slate-800 text-sm tracking-tight">
                      {mainCat.name}
                    </span>
                    <span className="text-xxs font-semibold bg-primary-light text-primary px-2 py-0.5 rounded-full uppercase">
                      {(mainCat.categories || []).length} Categories
                    </span>
                  </div>
                  {isMainExpanded ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                </div>

                {/* Categories inside Main Category */}
                {isMainExpanded && (
                  <div className="px-6 py-2 flex flex-col divide-y divide-slate-100/50">
                    {(mainCat.categories || []).map((cat: any) => {
                      const isCatExpanded = !!expandedCategories[cat.id] || !!searchQuery;
                      return (
                        <div key={cat.id} className="py-3 flex flex-col gap-2.5">
                          <div
                            onClick={() => toggleCategory(cat.id)}
                            className="flex items-center justify-between cursor-pointer select-none group"
                          >
                            <div className="flex items-center gap-2.5">
                              <Tag className="h-4.5 w-4.5 text-slate-400 shrink-0 group-hover:text-primary transition-colors" />
                              <span className="font-medium text-slate-700 text-sm group-hover:text-slate-900">
                                {cat.name}
                              </span>
                            </div>
                            {isCatExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                          </div>

                          {/* Sub Categories */}
                          {isCatExpanded && (
                            <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {(cat.subCategories || []).map((sub: any) => (
                                <div
                                  key={sub.id}
                                  className="bg-slate-50 border border-slate-100 hover:border-slate-200 p-3 rounded-lg text-slate-600 hover:text-slate-800 transition-colors text-xs font-medium"
                                >
                                  {sub.name}
                                </div>
                              ))}
                              {(cat.subCategories || []).length === 0 && (
                                <span className="text-xxs text-slate-400 italic">
                                  No subcategories registered.
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {(mainCat.categories || []).length === 0 && (
                      <div className="py-4 text-center text-xs text-slate-400 italic">
                        No categories registered in this section.
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export const ServiceCatalog = React.memo(ServiceCatalogComponent);
ServiceCatalog.displayName = 'ServiceCatalog';
export default ServiceCatalog;
