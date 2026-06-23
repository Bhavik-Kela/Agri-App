import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { colors, radius, spacing, typography } from "../theme/theme";

const CATEGORY_ICONS = {
  Vegetable: "🥬",
  Fruit: "🍎",
  Grain: "🌾",
  Dairy: "🥛",
  Other: "📦",
};

export default function ProductCard({ product, onPress, footer }) {
  const icon = CATEGORY_ICONS[product?.category] || CATEGORY_ICONS.Other;
  const displayPrice = product?.pricePerUnit ? `₹${product.pricePerUnit}/${product.unit}` : `₹${product?.price}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        {product?.photo ? (
          <Image
            source={{ uri: product.photo }}
            style={styles.productImage}
          />
        ) : (
          <Text style={styles.icon}>{icon}</Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {product?.name}
        </Text>
        {product?.otherProductName && (
          <Text style={styles.otherName}>{product.otherProductName}</Text>
        )}
        <Text style={styles.category}>{product?.category}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.price}>{displayPrice}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.quantity}>
            {product?.quantity} {product?.unit || 'units'}
          </Text>
        </View>
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.forestDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.leafLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    overflow: "hidden",
  },
  icon: {
    fontSize: 26,
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.title,
    fontSize: 16,
  },
  otherName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontStyle: "italic",
  },
  category: {
    ...typography.label,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.amberDark,
  },
  dot: {
    color: colors.textSecondary,
    marginHorizontal: 6,
  },
  quantity: {
    ...typography.body,
    fontSize: 13,
  },
  footer: {
    marginLeft: spacing.sm,
  },
});
