import { useWindowDimensions } from 'react-native';

export function useResponsive() {
    const { width, height } = useWindowDimensions();

    const isCompact = width <= 400; // Captures base models like iPhone 15/16/17 (390-393)
    const isSmallMobile = width <= 430; // Captures Pro Max / Plus bounds
    const isTablet = width >= 768; // iPad and larger
    const isShort = height <= 860; // Captures base models vertically (iPhone 17 is 852)

    return {
        width,
        height,
        isCompact,
        isSmallMobile, // Basically "isMobile" now
        isTablet,
        isShort,
    };
}
