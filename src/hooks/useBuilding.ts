import useUIStore from '@/stores/uiStore';

export const useBuilding = () => {
  const activeBuildingId = useUIStore((state) => state.activeBuildingId);
  const setBuilding = useUIStore((state) => state.setBuilding);

  return {
    activeBuildingId,
    set: setBuilding,
  };
};
