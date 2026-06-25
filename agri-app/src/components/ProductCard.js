import React from "react";
import { View, Text, Pressable, StyleSheet, Image } from "react-native";
import { mono, radius, spacing, colors } from "../theme/theme";

const SERVER_ORIGIN = "http://10.148.186.109:5000";

function resolveImageUri(photo) {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }
  return `${SERVER_ORIGIN}${photo.startsWith("/") ? "" : "/"}${photo}`;
}

const CATEGORY_ICONS = {
  Vegetable: "🥬",
  Fruit: "🍎",
  Grain: "🌾",
  Dairy: "🥛",
  Other: "📦",
};

export default function ProductCard({ product, onPress, onFarmerPress, footer }) {
  const icon = CATEGORY_ICONS[product?.category] || CATEGORY_ICONS.Other;
  const displayPrice = product?.pricePerUnit ? `₹${product.pricePerUnit}/${product.unit}` : `₹${product?.price}`;
  const farmerName = product?.farmer?.name;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        {product?.photo ? (
          <Image
            source={{ uri: resolveImageUri(product.photo) }}
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
        {product?.averageRating ? (
          <View style={styles.productRatingRow}>
            <Text style={styles.productRatingStar}>★</Text>
            <Text style={styles.productRatingValue}>
              {Number(product.averageRating).toFixed(1)}
            </Text>
            <Text style={styles.productRatingLabel}>
              product rating · {product.reviewCount}{" "}
              {product.reviewCount === 1 ? "review" : "reviews"}
            </Text>
          </View>
        ) : null}

        {farmerName ? (
          <Pressable
            onPress={onFarmerPress}
            disabled={!onFarmerPress}
            style={({ pressed }) => [
              styles.farmerRow,
              pressed && onFarmerPress && styles.farmerRowPressed,
            ]}
          >
            <Text style={styles.farmerName} numberOfLines={1}>
              Sold by {farmerName}
            </Text>
            {product?.farmer?.averageFarmerRating ? (
              <View style={styles.farmerRatingRow}>
                <Text style={styles.farmerRatingStar}>★</Text>
                <Text style={styles.farmerRatingValue}>
                  {Number(product.farmer.averageFarmerRating).toFixed(1)}
                </Text>
                <Text style={styles.farmerRatingLabel}>
                  farmer rating · {product.farmer.farmerReviewCount}{" "}
                  {product.farmer.farmerReviewCount === 1 ? "review" : "reviews"}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
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
    backgroundColor: colors.chipBg,
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
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  otherName: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
    fontStyle: "italic",
  },
  category: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.inkSoft,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  productRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: 3,
  },
  productRatingStar: {
    fontSize: 12,
    color: "#D4A017",
  },
  productRatingValue: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  productRatingLabel: {
    fontSize: 11,
    color: colors.inkSoft,
    marginLeft: 2,
  },
  farmerRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.faint,
  },
  farmerRowPressed: {
    opacity: 0.6,
  },
  farmerName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  farmerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 3,
  },
  farmerRatingStar: {
    fontSize: 11,
    color: "#D4A017",
  },
  farmerRatingValue: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.inkSoft,
  },
  farmerRatingLabel: {
    fontSize: 11,
    color: colors.inkSoft,
    marginLeft: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  dot: {
    color: colors.surfaceRaised,
    marginHorizontal: 6,
  },
  quantity: {
    fontSize: 13,
    color: colors.inkSoft},
  footer: {
    marginLeft: spacing.sm,
  },
});